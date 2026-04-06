#!/usr/bin/env python3
"""
Tests for ingest.py — reproduces bugs found in the onboarding wizard flow.

Bug 1: PDF text extraction produces placeholder text when pdfplumber/pypdf
        is missing (Docker image only installs python3, not pip packages).

Bug 2: After ingest, raw entries exist in raw/entries/ but no wiki articles
        are created in wiki/. The wiki home page reads from wiki/ only,
        so the user sees "wiki is empty" after completing the onboarding wizard.

Run: python3 test_ingest.py
"""

import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).parent))
import ingest

TEST_PDF = Path(__file__).parent / "data" / "files" / "Etornam-Sunu-Bright-Resume-Phd.pdf"


class TestPdfTextExtraction(unittest.TestCase):
    """Bug 1: PDF extraction must produce real content, not a placeholder."""

    def test_pdf_extraction_produces_real_content(self):
        if not TEST_PDF.exists():
            self.skipTest(f"Test PDF not found at {TEST_PDF}")

        text = ingest.extract_pdf_text(TEST_PDF)

        self.assertNotIn(
            "install pdfplumber or pypdf to extract text",
            text,
            "PDF extraction returned placeholder — no PDF library is installed",
        )
        self.assertIn("Bright Etornam Sunu", text)
        self.assertGreater(len(text), 200)


class TestIngestCreatesRawEntries(unittest.TestCase):
    """Verify ingest.py produces raw entries from uploaded files."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self._orig_entries = ingest.ENTRIES_DIR
        ingest.ENTRIES_DIR = Path(self.tmp) / "raw" / "entries"
        ingest.ENTRIES_DIR.mkdir(parents=True)

    def tearDown(self):
        ingest.ENTRIES_DIR = self._orig_entries
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_pdf_ingest_creates_entry(self):
        if not TEST_PDF.exists():
            self.skipTest(f"Test PDF not found at {TEST_PDF}")

        count = ingest.ingest_pdf(TEST_PDF, "files")

        self.assertEqual(count, 1)
        entries = list(ingest.ENTRIES_DIR.glob("*.md"))
        self.assertEqual(len(entries), 1)

        content = entries[0].read_text()
        self.assertIn("source_type: files", content)
        self.assertIn("filename: Etornam-Sunu-Bright-Resume-Phd.pdf", content)


class TestIngestCreatesWikiArticles(unittest.TestCase):
    """Bug 2: After ingest + seed, wiki articles must exist."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self._orig_entries = ingest.ENTRIES_DIR
        self._orig_root = ingest.ROOT
        ingest.ENTRIES_DIR = Path(self.tmp) / "raw" / "entries"
        ingest.ENTRIES_DIR.mkdir(parents=True)
        ingest.ROOT = Path(self.tmp)

    def tearDown(self):
        ingest.ENTRIES_DIR = self._orig_entries
        ingest.ROOT = self._orig_root
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_generate_seed_articles_creates_wiki_content(self):
        """After ingesting a PDF and seeding, wiki/ must have articles."""
        if not TEST_PDF.exists():
            self.skipTest(f"Test PDF not found at {TEST_PDF}")

        ingest.ingest_pdf(TEST_PDF, "files")
        entries = list(ingest.ENTRIES_DIR.glob("*.md"))
        self.assertGreater(len(entries), 0, "Precondition: raw entries must exist")

        ingest.generate_seed_articles()

        wiki_dir = Path(self.tmp) / "wiki"
        wiki_articles = [
            f for f in wiki_dir.rglob("*.md")
            if not f.name.startswith("_")
        ]
        self.assertGreater(
            len(wiki_articles), 0,
            "generate_seed_articles must create wiki articles from raw entries",
        )

        article = wiki_articles[0].read_text()
        self.assertIn("title:", article)
        self.assertIn("type: document", article)
        self.assertIn("sources:", article)

    def test_wiki_index_is_generated(self):
        """_index.md must exist and list articles."""
        if not TEST_PDF.exists():
            self.skipTest(f"Test PDF not found at {TEST_PDF}")

        ingest.ingest_pdf(TEST_PDF, "files")
        ingest.generate_seed_articles()

        index_path = Path(self.tmp) / "wiki" / "_index.md"
        self.assertTrue(index_path.exists(), "_index.md must be created")
        index_text = index_path.read_text()
        self.assertIn("# Wiki Index", index_text)
        self.assertIn("Articles", index_text)

    def test_backlinks_json_is_generated(self):
        """_backlinks.json must exist."""
        if not TEST_PDF.exists():
            self.skipTest(f"Test PDF not found at {TEST_PDF}")

        ingest.ingest_pdf(TEST_PDF, "files")
        ingest.generate_seed_articles()

        bl_path = Path(self.tmp) / "wiki" / "_backlinks.json"
        self.assertTrue(bl_path.exists(), "_backlinks.json must be created")

    def test_article_placed_in_source_type_directory(self):
        """Wiki article should be in wiki/{source_type}/."""
        if not TEST_PDF.exists():
            self.skipTest(f"Test PDF not found at {TEST_PDF}")

        ingest.ingest_pdf(TEST_PDF, "files")
        ingest.generate_seed_articles()

        files_dir = Path(self.tmp) / "wiki" / "files"
        self.assertTrue(files_dir.exists(), "wiki/files/ directory must exist")
        articles = list(files_dir.glob("*.md"))
        self.assertGreater(len(articles), 0, "Article must be in wiki/files/")


if __name__ == "__main__":
    unittest.main(verbosity=2)
