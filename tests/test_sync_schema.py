import json
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

class TestSyncSchema(unittest.TestCase):
    def setUp(self):
        self.json_path = REPO_ROOT / ".agents" / "sync" / "handoff.json"
        self.md_path = REPO_ROOT / ".agents" / "sync" / "handoff.md"

    def test_handoff_json_exists_and_valid(self):
        self.assertTrue(self.json_path.exists(), f"Missing {self.json_path}")
        with open(self.json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        required_keys = [
            "version",
            "task_id",
            "active_agent",
            "status",
            "turn_count",
            "max_turns",
            "last_updated",
            "summary",
            "files_modified"
        ]
        for key in required_keys:
            self.assertIn(key, data, f"Missing key '{key}' in handoff.json")
        
        self.assertIn(data["status"], ["idle", "ready_for_verification", "verification_failed", "verified"])
        self.assertIn(data["active_agent"], ["claude", "antigravity"])
        self.assertIsInstance(data["turn_count"], int)
        self.assertIsInstance(data["max_turns"], int)
        self.assertIsInstance(data["files_modified"], list)

    def test_handoff_md_exists_and_contains_headings(self):
        self.assertTrue(self.md_path.exists(), f"Missing {self.md_path}")
        content = self.md_path.read_text(encoding="utf-8")
        self.assertIn("# Agent Handoff Ticket", content)
        self.assertIn("## Changes Implemented by Claude", content)
        self.assertIn("## Verification Report by Antigravity", content)

if __name__ == "__main__":
    unittest.main()
