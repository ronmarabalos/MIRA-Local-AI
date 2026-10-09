import os
import re
import unittest
from pathlib import Path

class TestDocsIntegrity(unittest.TestCase):
    def setUp(self):
        self.root = Path(__file__).resolve().parent.parent
        self.docs_ai = self.root / "docs" / "ai"

    def test_required_docs_exist(self):
        for doc_name in ["agent-handbook.md", "workflows.md", "architecture.md"]:
            doc_file = self.docs_ai / doc_name
            self.assertTrue(doc_file.exists(), f"Doc {doc_file} must exist")
            content = doc_file.read_text(encoding="utf-8")
            self.assertGreater(len(content.strip()), 100, f"Doc {doc_name} must not be empty")

    def test_specs_directory_exists(self):
        specs_dir = self.root / "docs" / "specs"
        self.assertTrue(specs_dir.exists(), "docs/specs/ directory must exist")

    def test_markdown_links_are_valid(self):
        files_to_check = [
            self.root / "AGENTS.md",
            self.root / "CLAUDE.md",
            self.root / "GEMINI.md",
            self.docs_ai / "agent-handbook.md",
            self.docs_ai / "workflows.md",
            self.docs_ai / "architecture.md",
            self.root / "docs" / "rules" / "README.md",
        ]
        for f in files_to_check:
            self.assertTrue(f.exists(), f"File {f.name} must exist")
            content = f.read_text(encoding="utf-8")
            links = re.findall(r"\[([^\]]+)\]\(([^)]+)\)", content)
            for text, url in links:
                if url.startswith("file:///"):
                    if os.name == "nt":
                        path_str = url.replace("file:///", "").replace("/", "\\")
                    else:
                        path_str = url.replace("file://", "")
                    p = Path(path_str)
                    self.assertTrue(p.exists(), f"Broken file link in {f.name}: {url}")
                elif not url.startswith(("http://", "https://", "#", "mailto:")):
                    target = (f.parent / url).resolve()
                    self.assertTrue(target.exists(), f"Broken relative link in {f.name}: {url}")

if __name__ == "__main__":
    unittest.main()
