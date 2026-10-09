import unittest
import subprocess
import json
import shutil
from pathlib import Path

class TestProjectInit(unittest.TestCase):
    def setUp(self):
        self.root = Path(__file__).resolve().parent.parent
        self.script = self.root / "scripts" / "init-project.mjs"
        self.blueprint_file = self.root / "project-blueprint.json"
        self.plan_file = self.root / "docs" / "PLAN.md"
        self.package_file = self.root / "package.json"
        self.handoff_file = self.root / ".agents" / "sync" / "handoff.json"
        self.handoff_md_file = self.root / ".agents" / "sync" / "handoff.md"

        self.archive_dir = self.root / ".agents" / "skills-archive"
        self.skills_dir = self.root / ".agents" / "skills"

        # Backup files before each test to leave repo clean
        self.blueprint_backup = self.blueprint_file.read_text(encoding="utf-8")
        self.plan_backup = self.plan_file.read_text(encoding="utf-8")
        self.package_backup = self.package_file.read_text(encoding="utf-8")
        self.handoff_backup = self.handoff_file.read_text(encoding="utf-8")
        self.handoff_md_backup = self.handoff_md_file.read_text(encoding="utf-8")

    def tearDown(self):
        # Restore backups
        self.blueprint_file.write_text(self.blueprint_backup, encoding="utf-8")
        self.plan_file.write_text(self.plan_backup, encoding="utf-8")
        self.package_file.write_text(self.package_backup, encoding="utf-8")
        self.handoff_file.write_text(self.handoff_backup, encoding="utf-8")
        self.handoff_md_file.write_text(self.handoff_md_backup, encoding="utf-8")

        # Restore any archived skills back to active
        if self.archive_dir.exists():
            for archived in list(self.archive_dir.iterdir()):
                if archived.is_dir():
                    target = self.skills_dir / archived.name
                    if not target.exists():
                        archived.rename(target)

        # Clean up scaffolded src directory
        src_dir = self.root / "src"
        if src_dir.exists():
            shutil.rmtree(src_dir)

    def test_invalid_preset_fails_gracefully(self):
        cmd = [
            "node", str(self.script),
            "--preset", "nonexistent-preset",
            "--non-interactive"
        ]
        res = subprocess.run(cmd, cwd=self.root, capture_output=True, text=True)
        self.assertEqual(res.returncode, 1)
        self.assertIn("not found", res.stderr.lower())

    def test_non_interactive_init_execution(self):
        cmd = [
            "node", str(self.script),
            "--preset", "minimal-hackathon",
            "--name", "demo-ai-hack",
            "--desc", "AI Hackathon Demo Project",
            "--dev1", "Steve",
            "--dev2", "Bob",
            "--non-interactive"
        ]
        res = subprocess.run(cmd, cwd=self.root, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"init-project failed: {res.stderr}")

        # 1. Blueprint status updated
        blueprint = json.loads(self.blueprint_file.read_text(encoding="utf-8"))
        self.assertEqual(blueprint["status"], "initialized")
        self.assertEqual(blueprint["project"]["name"], "demo-ai-hack")
        self.assertEqual(blueprint["project"]["team"]["dev1"]["name"], "Steve")

        # 2. Package.json updated
        pkg = json.loads(self.package_file.read_text(encoding="utf-8"))
        self.assertEqual(pkg["name"], "demo-ai-hack")
        self.assertEqual(pkg["description"], "AI Hackathon Demo Project")

        # 3. PLAN.md updated
        plan_content = self.plan_file.read_text(encoding="utf-8")
        self.assertIn("demo-ai-hack", plan_content)
        self.assertIn("Steve", plan_content)
        self.assertIn("Bob", plan_content)

        # 4. Handoff reset
        handoff = json.loads(self.handoff_file.read_text(encoding="utf-8"))
        self.assertEqual(handoff["status"], "idle")
        self.assertEqual(handoff["turn_count"], 0)

if __name__ == "__main__":
    unittest.main()
