import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

class TestE2EBatonFlow(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        self.sync_json = Path(self.tmpdir) / "handoff.json"
        self.sync_md = Path(self.tmpdir) / "handoff.md"

        initial_state = {
            "version": "1.0",
            "task_id": "TEST-01",
            "active_agent": "claude",
            "status": "idle",
            "turn_count": 0,
            "max_turns": 5,
            "last_updated": "2026-10-08T00:00:00.000Z",
            "summary": "E2E testing",
            "files_modified": []
        }
        with open(self.sync_json, "w", encoding="utf-8") as f:
            json.dump(initial_state, f)

    def tearDown(self):
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def test_tier_1_express_pass(self):
        code = f"""
        import {{ readSyncState, writeSyncState }} from './scripts/baton.mjs';
        const state = readSyncState('{self.sync_json}');
        state.status = 'verified';
        writeSyncState(state, '{self.sync_json}');
        """
        cmd = ["node", "--input-type=module", "-e", code]
        res = subprocess.run(cmd, cwd=REPO_ROOT, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0)

        with open(self.sync_json, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(data["status"], "verified")

    def test_circuit_breaker_halts_at_max_turns(self):
        state = {
            "version": "1.0",
            "task_id": "TEST-02",
            "active_agent": "claude",
            "status": "verification_failed",
            "turn_count": 5,
            "max_turns": 5,
            "last_updated": "2026-10-08T00:00:00.000Z",
            "summary": "Failing loop",
            "files_modified": ["src/app.ts"]
        }
        with open(self.sync_json, "w", encoding="utf-8") as f:
            json.dump(state, f)

        code = f"""
        import {{ checkCircuitBreaker, readSyncState }} from './scripts/baton.mjs';
        const st = readSyncState('{self.sync_json}');
        if (!checkCircuitBreaker(st)) {{
            process.exit(42);
        }}
        """
        cmd = ["node", "--input-type=module", "-e", code]
        res = subprocess.run(cmd, cwd=REPO_ROOT, capture_output=True, text=True)
        self.assertEqual(res.returncode, 42, "Circuit breaker should have halted execution with exit 42")

    def test_cli_status_command(self):
        cmd = ["node", "scripts/baton.mjs", "status"]
        res = subprocess.run(cmd, cwd=REPO_ROOT, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0)
        self.assertIn("=== Baton Sync Status ===", res.stdout)
        self.assertIn("Detected Tier:", res.stdout)

    def test_cli_verify_tier1_express(self):
        cmd = ["node", "scripts/baton.mjs", "verify", "--tier", "1"]
        res = subprocess.run(cmd, cwd=REPO_ROOT, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0)
        self.assertIn("Tier 1 Express Lane", res.stdout)

if __name__ == "__main__":
    unittest.main()
