import unittest
from pathlib import Path

class TestRootRules(unittest.TestCase):
    def setUp(self):
        self.root = Path(__file__).resolve().parent.parent

    def test_agents_md_exists_and_contains_tenets(self):
        agents_file = self.root / "AGENTS.md"
        self.assertTrue(agents_file.exists(), "AGENTS.md must exist at repo root")
        content = agents_file.read_text(encoding="utf-8")
        self.assertIn("Evidence before assertions", content)
        self.assertIn("file://", content)
        self.assertIn(".agents/skills", content)

    def test_compatibility_pointers_reference_agents(self):
        for pointer_name in ["GEMINI.md", "CLAUDE.md", ".cursorrules"]:
            pointer = self.root / pointer_name
            self.assertTrue(pointer.exists(), f"{pointer_name} must exist at repo root")
            content = pointer.read_text(encoding="utf-8")
            self.assertIn("AGENTS.md", content, f"{pointer_name} must reference AGENTS.md")

if __name__ == "__main__":
    unittest.main()
