import unittest
import subprocess
import json
import shutil
from pathlib import Path

class TestSkillsManager(unittest.TestCase):
    def setUp(self):
        self.root = Path(__file__).resolve().parent.parent
        self.skills_dir = self.root / ".agents" / "skills"
        self.archive_dir = self.root / ".agents" / "skills-archive"
        self.script = self.root / "scripts" / "skills-manager.mjs"

    def test_skills_manager_list_command(self):
        res = subprocess.run(["node", str(self.script), "list", "--json"], cwd=self.root, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"skills-manager list failed: {res.stderr}")
        data = json.loads(res.stdout)
        self.assertIn("active", data)
        self.assertIn("archived", data)
        self.assertIsInstance(data["active"], list)
        self.assertIsInstance(data["archived"], list)

    def test_disable_and_enable_skill_roundtrip(self):
        # We test with a dummy skill folder in .agents/skills to avoid tampering with real skills during tests
        test_skill = self.skills_dir / "_test_dummy_skill"
        test_skill.mkdir(parents=True, exist_ok=True)
        (test_skill / "SKILL.md").write_text("---\nname: _test_dummy_skill\ndescription: dummy test\n---\n", encoding="utf-8")

        try:
            # Disable
            res = subprocess.run(["node", str(self.script), "disable", "_test_dummy_skill"], cwd=self.root, capture_output=True, text=True)
            self.assertEqual(res.returncode, 0, f"disable failed: {res.stderr}")
            self.assertFalse((self.skills_dir / "_test_dummy_skill").exists())
            self.assertTrue((self.archive_dir / "_test_dummy_skill").exists())

            # Enable
            res = subprocess.run(["node", str(self.script), "enable", "_test_dummy_skill"], cwd=self.root, capture_output=True, text=True)
            self.assertEqual(res.returncode, 0, f"enable failed: {res.stderr}")
            self.assertTrue((self.skills_dir / "_test_dummy_skill").exists())
            self.assertFalse((self.archive_dir / "_test_dummy_skill").exists())
        finally:
            # Clean up dummy test skill
            if (self.skills_dir / "_test_dummy_skill").exists():
                shutil.rmtree(self.skills_dir / "_test_dummy_skill")
            if (self.archive_dir / "_test_dummy_skill").exists():
                shutil.rmtree(self.archive_dir / "_test_dummy_skill")

if __name__ == "__main__":
    unittest.main()
