#!/usr/bin/env python3
"""
Skill Seeker Orchestrator & Staging Gate
Wraps the `skill-seekers` engine via ephemeral `uvx`, outputs into `_staging/`,
validates compliance against repository standards, and handles catalog promotion.
"""

import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path


def get_repo_paths() -> tuple[Path, Path, Path]:
    """Returns (repo_root, staging_dir, active_skills_dir)."""
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent.parent.parent.parent
    staging_dir = repo_root / ".agents" / "skills" / "_staging"
    active_skills_dir = repo_root / ".agents" / "skills"
    return repo_root, staging_dir, active_skills_dir


def validate_skill_directory(dir_path: Path) -> tuple[bool, list[str]]:
    """Validates that a skill directory meets repository standards.
    
    Checks:
    - SKILL.md exists
    - Valid YAML frontmatter delimited by `---`
    - Non-empty `name:` and `description:` fields
    """
    errors: list[str] = []
    skill_file = dir_path / "SKILL.md"
    
    if not skill_file.is_file():
        errors.append(f"Missing SKILL.md in {dir_path}")
        return False, errors
    
    try:
        content = skill_file.read_text(encoding="utf-8")
    except Exception as e:
        errors.append(f"Cannot read SKILL.md: {e}")
        return False, errors
        
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
    if not match:
        errors.append("Invalid YAML frontmatter: must be delimited by '---'")
        return False, errors
        
    frontmatter = match.group(1)
    
    name_match = re.search(r"^name:\s*([^\n\r]+)", frontmatter, re.MULTILINE)
    if not name_match or not name_match.group(1).strip():
        errors.append("YAML frontmatter must include a non-empty 'name' field")
        
    desc_match = re.search(r"^description:\s*([^\n\r]+)", frontmatter, re.MULTILINE)
    if not desc_match or not desc_match.group(1).strip():
        errors.append("YAML frontmatter must include a non-empty 'description' field")
        
    return len(errors) == 0, errors


def list_staged_skills(staging_dir: Path) -> list[str]:
    """Returns a sorted list of skill folder names in the staging directory."""
    if not staging_dir.exists():
        return []
    return sorted([
        p.name for p in staging_dir.iterdir()
        if p.is_dir() and not p.name.startswith(".")
    ])


def promote_staged_skill(
    name: str,
    staging_dir: Path,
    target_dir: Path,
    force: bool = False
) -> tuple[bool, str]:
    """Promotes a validated staged skill into the active domain skills directory."""
    source_path = staging_dir / name
    if not source_path.is_dir():
        return False, f"Staged skill '{name}' does not exist at {source_path}"
        
    is_valid, errors = validate_skill_directory(source_path)
    if not is_valid:
        return False, f"Cannot promote invalid skill: {'; '.join(errors)}"
        
    dest_path = target_dir / name
    if dest_path.exists():
        if not force:
            return False, f"Skill '{name}' already exists in target directory. Use --force to overwrite."
        shutil.rmtree(dest_path)
        
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(source_path), str(dest_path))
    return True, f"Skill '{name}' successfully promoted to {dest_path}"


def run_uvx_scrape(
    source_type: str,
    source: str,
    name: str,
    staging_dir: Path
) -> int:
    """Executes `skill-seekers` non-interactively via `uvx` into a staging subfolder."""
    uvx_path = shutil.which("uvx")
    if not uvx_path:
        # Check standard user local bin
        user_uvx = Path.home() / ".local" / "bin" / "uvx"
        if user_uvx.is_file():
            uvx_path = str(user_uvx)
        else:
            print("Error: `uvx` (part of astral uv) is required to run Skill Seekers ephemerally.", file=sys.stderr)
            print("Install uv via: curl -LsSf https://astral.sh/uv/install.sh | sh", file=sys.stderr)
            return 1

    dest_folder = staging_dir / name
    dest_folder.mkdir(parents=True, exist_ok=True)
    
    cmd = [uvx_path, "--from", "skill-seekers", "skill-seekers"]
    
    if source_type == "url":
        cmd.extend(["--url", source, "--output", str(dest_folder)])
    elif source_type == "repo":
        cmd.extend(["--repo", source, "--output", str(dest_folder)])
    elif source_type == "pdf":
        cmd.extend(["--pdf", source, "--output", str(dest_folder)])
    else:
        print(f"Unknown source type: {source_type}", file=sys.stderr)
        return 1

    print(f"Executing: {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, check=False)
        if result.returncode == 0:
            print(f"\nScrape complete! Staged skill created at: {dest_folder}")
            is_valid, errors = validate_skill_directory(dest_folder)
            if is_valid:
                print("✓ Validation passed. Ready for review or promotion via --promote.")
            else:
                print(f"⚠ Warning: Staged skill requires manual refinement: {errors}")
        return result.returncode
    except Exception as e:
        print(f"Execution error: {e}", file=sys.stderr)
        return 1


def main() -> None:
    repo_root, staging_dir, active_skills_dir = get_repo_paths()

    parser = argparse.ArgumentParser(
        description="Skill Seeker Orchestrator & Staging Gate (Yzentic-setup)"
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--url", help="Scrape documentation from a website URL")
    group.add_argument("--repo", help="Analyze GitHub repository (format: owner/repo)")
    group.add_argument("--pdf", help="Extract skills from a local technical PDF file")
    group.add_argument("--list-staged", action="store_true", help="List all draft skills in staging")
    group.add_argument("--validate", help="Validate a specific directory against skill standards")
    group.add_argument("--promote", help="Promote a staged skill into the active domain catalog")

    parser.add_argument("--name", help="Name for the skill (required with --url, --repo, or --pdf)")
    parser.add_argument("--force", action="store_true", help="Force overwrite existing skill on promotion")

    args = parser.parse_args()

    if args.list_staged:
        staged = list_staged_skills(staging_dir)
        if not staged:
            print("No staged skills found in .agents/skills/_staging/")
        else:
            print("Staged Skills:")
            for s in staged:
                is_valid, errors = validate_skill_directory(staging_dir / s)
                status = "✓ VALID" if is_valid else f"⚠ INVALID ({'; '.join(errors)})"
                print(f" - {s} [{status}]")
        sys.exit(0)

    if args.validate:
        target = Path(args.validate).resolve()
        is_valid, errors = validate_skill_directory(target)
        if is_valid:
            print(f"✓ {target} is a valid skill directory.")
            sys.exit(0)
        else:
            print(f"✗ Validation failed for {target}:", file=sys.stderr)
            for err in errors:
                print(f"  - {err}", file=sys.stderr)
            sys.exit(1)

    if args.promote:
        success, msg = promote_staged_skill(
            args.promote,
            staging_dir,
            active_skills_dir,
            force=args.force
        )
        if success:
            print(f"✓ {msg}")
            sys.exit(0)
        else:
            print(f"✗ {msg}", file=sys.stderr)
            sys.exit(1)

    # Scrape execution requires --name
    if not args.name:
        parser.error("--name <skill-name> is required when scraping with --url, --repo, or --pdf")

    source_type = "url" if args.url else "repo" if args.repo else "pdf"
    source = args.url or args.repo or args.pdf
    code = run_uvx_scrape(source_type, source, args.name, staging_dir)
    sys.exit(code)


if __name__ == "__main__":
    main()
