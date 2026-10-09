import unittest
import shutil
import subprocess
from pathlib import Path

class TestScaffolder(unittest.TestCase):
    def setUp(self):
        self.root = Path(__file__).resolve().parent.parent
        self.src_dir = self.root / "src"
        self.script = self.root / "scripts" / "scaffolder.mjs"

    def tearDown(self):
        if self.src_dir.exists():
            shutil.rmtree(self.src_dir)

    def test_scaffold_fullstack_web(self):
        cmd = ["node", str(self.script), "--preset", "fullstack-web", "--name", "MyTestApp", "--desc", "My App Pitch", "--dev1", "Steve", "--dev2", "Bob"]
        res = subprocess.run(cmd, cwd=self.root, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"scaffold failed: {res.stderr}")

        self.assertTrue((self.src_dir / "App.tsx").exists())
        self.assertTrue((self.src_dir / "index.css").exists())
        self.assertTrue((self.src_dir / "components" / "Header.tsx").exists())

        app_content = (self.src_dir / "App.tsx").read_text(encoding="utf-8")
        self.assertIn("MyTestApp", app_content)
        self.assertIn("Steve", app_content)

    def test_scaffold_ai_agent_app(self):
        cmd = ["node", str(self.script), "--preset", "ai-agent-app", "--name", "AgentFlow", "--desc", "AI Pipeline", "--dev1", "Alice", "--dev2", "Bob"]
        res = subprocess.run(cmd, cwd=self.root, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"scaffold failed: {res.stderr}")

        self.assertTrue((self.src_dir / "pipeline.py").exists())
        self.assertTrue((self.src_dir / "config.py").exists())
        self.assertTrue((self.src_dir / "api.py").exists())

    def test_scaffold_minimal_hackathon(self):
        cmd = ["node", str(self.script), "--preset", "minimal-hackathon", "--name", "SpeedDemo", "--desc", "Ultra Lean", "--dev1", "Alice", "--dev2", "Bob"]
        res = subprocess.run(cmd, cwd=self.root, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"scaffold failed: {res.stderr}")

        self.assertTrue((self.src_dir / "index.html").exists())
        self.assertTrue((self.src_dir / "app.js").exists())

if __name__ == "__main__":
    unittest.main()
