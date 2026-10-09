import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

class TestPlanIntegrity(unittest.TestCase):
    def setUp(self):
        self.plan_path = REPO_ROOT / "docs" / "PLAN.md"

    def test_plan_file_exists(self):
        self.assertTrue(self.plan_path.exists(), f"Missing {self.plan_path}")

    def test_plan_contains_required_sections(self):
        self.assertTrue(self.plan_path.exists(), f"Missing {self.plan_path}")
        content = self.plan_path.read_text(encoding="utf-8")
        
        required_sections = [
            "Mission & Hackathon Objective",
            "Current Sprint Focus",
            "P0: Must-Have for Demo",
            "P1: High Impact Polish",
            "P2: Post-Hackathon Stretch",
            "Rules for Adding Features"
        ]
        for section in required_sections:
            self.assertIn(section, content, f"Missing section '{section}' in docs/PLAN.md")

    def test_plan_contains_priority_and_status_tags(self):
        content = self.plan_path.read_text(encoding="utf-8")
        self.assertIn("Priority:", content)
        self.assertIn("Status:", content)

if __name__ == "__main__":
    unittest.main()
