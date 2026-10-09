import unittest
import json
from pathlib import Path

class TestBlueprintSchema(unittest.TestCase):
    def setUp(self):
        self.root = Path(__file__).resolve().parent.parent
        self.blueprint_file = self.root / "project-blueprint.json"

    def test_blueprint_file_exists_and_valid(self):
        self.assertTrue(self.blueprint_file.exists(), "project-blueprint.json must exist")
        data = json.loads(self.blueprint_file.read_text(encoding="utf-8"))
        self.assertIn("status", data)
        self.assertIn(data["status"], ["uninitialized", "initialized"])
        self.assertIn("project", data)
        self.assertIn("archetypes", data)
        for expected in ["fullstack-web", "ai-agent-app", "frontend-dashboard", "minimal-hackathon"]:
            self.assertIn(expected, data["archetypes"])
            self.assertIn("keep_skills", data["archetypes"][expected])
            self.assertIn("rules_preset", data["archetypes"][expected])

if __name__ == "__main__":
    unittest.main()
