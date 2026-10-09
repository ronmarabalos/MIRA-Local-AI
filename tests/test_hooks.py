import unittest
import subprocess
from pathlib import Path

class TestGitHooks(unittest.TestCase):
    def setUp(self):
        self.root = Path(__file__).resolve().parent.parent
        self.githooks_dir = self.root / ".githooks"
        self.pre_commit_hook = self.githooks_dir / "pre-commit"
        self.install_script = self.root / "scripts" / "install-hooks.mjs"

    def test_install_hooks_configures_git_and_creates_hook(self):
        res = subprocess.run(["node", str(self.install_script)], cwd=self.root, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"install-hooks failed: {res.stderr}")

        # Hook exists and contains baton verify
        self.assertTrue(self.pre_commit_hook.exists(), ".githooks/pre-commit must exist")
        content = self.pre_commit_hook.read_text(encoding="utf-8")
        self.assertIn("scripts/baton.mjs verify", content)

        # Git core.hooksPath is configured
        git_res = subprocess.run(["git", "config", "core.hooksPath"], cwd=self.root, capture_output=True, text=True)
        self.assertEqual(git_res.returncode, 0)
        self.assertEqual(git_res.stdout.strip(), ".githooks")

if __name__ == "__main__":
    unittest.main()
