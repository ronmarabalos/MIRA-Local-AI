import unittest
import subprocess
import json
import shutil
from pathlib import Path

class TestE2EProjectBlueprint(unittest.TestCase):
    def setUp(self):
        self.root = Path(__file__).resolve().parent.parent
        self.init_script = self.root / "scripts" / "init-project.mjs"
        self.skills_script = self.root / "scripts" / "skills-manager.mjs"
        self.blueprint_file = self.root / "project-blueprint.json"
        self.plan_file = self.root / "docs" / "PLAN.md"
        self.package_file = self.root / "package.json"
        self.handoff_file = self.root / ".agents" / "sync" / "handoff.json"
        self.handoff_md_file = self.root / ".agents" / "sync" / "handoff.md"
        self.skills_dir = self.root / ".agents" / "skills"
        self.archive_dir = self.root / ".agents" / "skills-archive"

        # Backup state
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

    def test_full_project_init_and_skill_toggle_lifecycle(self):
        # 1. Execute project init
        cmd = [
            "node", str(self.init_script),
            "--preset", "fullstack-web",
            "--name", "e2e-demo-system",
            "--desc", "Fullstack AI Web App",
            "--dev1", "Alice",
            "--dev2", "Bob",
            "--non-interactive"
        ]
        res = subprocess.run(cmd, cwd=self.root, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"init failed: {res.stderr}")

        # 2. Check blueprint status
        bp = json.loads(self.blueprint_file.read_text(encoding="utf-8"))
        self.assertEqual(bp["status"], "initialized")
        self.assertEqual(bp["project"]["archetype"], "fullstack-web")
        self.assertEqual(bp["project"]["name"], "e2e-demo-system")

        # 3. Check active skills count
        res_list = subprocess.run(["node", str(self.skills_script), "list", "--json"], cwd=self.root, capture_output=True, text=True)
        self.assertEqual(res_list.returncode, 0)
        skills_data = json.loads(res_list.stdout)
        self.assertEqual(len(skills_data["active"]), 11)
        self.assertIn("ui-ux-pro-max", skills_data["active"])
        self.assertIn("caveman", skills_data["active"])
        self.assertIn("ponytail", skills_data["active"])

        # 4. Check archived skill can be restored on demand
        self.assertIn("slides", skills_data["archived"])
        res_enable = subprocess.run(["node", str(self.skills_script), "enable", "slides"], cwd=self.root, capture_output=True, text=True)
        self.assertEqual(res_enable.returncode, 0)
        self.assertTrue((self.skills_dir / "slides").exists())
        self.assertFalse((self.archive_dir / "slides").exists())

        # 5. Check baton verify works cleanly in initialized state
        res_baton = subprocess.run(["node", "scripts/baton.mjs", "status"], cwd=self.root, capture_output=True, text=True)
        self.assertEqual(res_baton.returncode, 0)

if __name__ == "__main__":
    unittest.main()
