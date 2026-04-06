#!/usr/bin/env python3
"""
ingest.py — Convert files in data/ into raw entries in raw/entries/

One .md file per logical entry with YAML frontmatter:
  id, date, time, source_type, tags, plus source-specific fields.

Idempotent: running twice produces the same output.

Optional LLM enhancement (Ollama):
  python ingest.py --llm                  # uses llama3.2 by default
  python ingest.py --llm --model mistral  # pick any Ollama model

When --llm is set the script will:
  • Clean up / restructure extracted PDF and HTML text
  • Summarise CSV rows into readable prose
  • Auto-detect the format of files that don't match a known pattern
  • Identify entry boundaries in unstructured plain-text files
Falls back silently to the rule-based path if Ollama is unreachable.
"""

import argparse
import csv
import hashlib
import json
import os
import re
import urllib.error
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).parent
DATA_DIR = ROOT / "data"
ENTRIES_DIR = ROOT / "raw" / "entries"
ENTRIES_DIR.mkdir(parents=True, exist_ok=True)

OLLAMA_BASE = "http://localhost:11434"


# ── Ollama client ──────────────────────────────────────────────

class OllamaClient:
    """Thin wrapper around the Ollama HTTP API."""

    def __init__(self, model: str = "llama3.2", base_url: str = OLLAMA_BASE) -> None:
        self.model = model
        self.base_url = base_url.rstrip("/")
        self._available: Optional[bool] = None

    def is_available(self) -> bool:
        if self._available is not None:
            return self._available
        try:
            urllib.request.urlopen(f"{self.base_url}/api/tags", timeout=3)
            self._available = True
        except Exception:
            self._available = False
            print(
                f"  [llm] Ollama not reachable at {self.base_url} — "
                "falling back to rule-based parsing."
            )
        return self._available

    def generate(self, prompt: str, max_tokens: int = 2048) -> str:
        """Send a prompt and return the response text, or '' on failure."""
        if not self.is_available():
            return ""
        payload = json.dumps(
            {"model": self.model, "prompt": prompt, "stream": False,
             "options": {"num_predict": max_tokens}}
        ).encode()
        req = urllib.request.Request(
            f"{self.base_url}/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read())
                return result.get("response", "").strip()
        except Exception as exc:
            print(f"  [llm] Request failed: {exc}")
            return ""

    # -- Convenience methods ----------------------------------------

    def clean_text(self, raw: str, context: str = "") -> str:
        """Remove artefacts, fix encoding issues, and reflow extracted text."""
        if not raw.strip():
            return raw
        snippet = raw[:6000]  # keep prompt manageable
        prompt = (
            f"You are cleaning extracted text from a {context or 'document'}. "
            "Fix OCR artefacts, remove repeated headers/footers, normalise whitespace, "
            "and reflow paragraphs. Preserve ALL content — do not summarise or omit anything. "
            "Output only the cleaned text, no commentary.\n\n"
            f"--- RAW TEXT ---\n{snippet}\n--- END ---"
        )
        cleaned = self.generate(prompt, max_tokens=4096)
        if not cleaned:
            return raw
        if len(raw) > 6000:
            cleaned += "\n\n" + raw[6000:]
        return cleaned

    def summarise_csv_row(self, row: dict) -> str:
        """Turn a CSV row dict into a short prose description."""
        fields = "\n".join(f"{k}: {v}" for k, v in row.items() if v and str(v).strip())
        prompt = (
            "Convert the following data record into 2–4 clear sentences of plain English. "
            "Include all fields; do not omit any values. Output only the sentences.\n\n"
            f"{fields}"
        )
        result = self.generate(prompt, max_tokens=512)
        return result or "\n".join(f"**{k}**: {v}" for k, v in row.items() if v)

    def detect_format(self, path: Path, sample: str) -> Optional[str]:
        """
        Ask the LLM what format this file is and how to parse it.
        Returns one of: dayone | whatsapp | twitter | imessage |
                        journal | notes | csv | unknown
        """
        prompt = (
            f"Identify the format of this file named '{path.name}'. "
            "Look at its content and decide which category best matches:\n"
            "  dayone — Day One journal JSON export\n"
            "  whatsapp — WhatsApp chat export (.txt)\n"
            "  twitter — Twitter/X archive\n"
            "  imessage — iMessage chat export\n"
            "  journal — personal diary or journal (plain text)\n"
            "  notes — general notes or memos\n"
            "  csv — tabular data\n"
            "  unknown — none of the above\n\n"
            "Reply with ONLY the single category word.\n\n"
            f"--- FILE SAMPLE ---\n{sample[:2000]}\n--- END ---"
        )
        result = self.generate(prompt, max_tokens=20)
        token = result.strip().lower().split()[0] if result.strip() else "unknown"
        valid = {"dayone", "whatsapp", "twitter", "imessage", "journal", "notes", "csv", "unknown"}
        return token if token in valid else "unknown"

    def split_journal_entries(self, text: str) -> list[dict]:
        """
        Ask the LLM to split a plain-text journal into individual entries.
        Returns a list of {date, time, text} dicts.
        """
        prompt = (
            "The following is a personal journal or diary as plain text. "
            "Split it into individual entries. For each entry output a JSON object with:\n"
            '  "date": "YYYY-MM-DD" (best guess, or "unknown"),\n'
            '  "time": "HH:MM:SS" (or "00:00:00"),\n'
            '  "text": <the full entry text>\n'
            "Output a JSON array of these objects. Output ONLY valid JSON, no commentary.\n\n"
            f"--- TEXT ---\n{text[:8000]}\n--- END ---"
        )
        raw = self.generate(prompt, max_tokens=4096)
        if not raw:
            return []
        # Strip markdown code fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
        raw = re.sub(r"\s*```$", "", raw.strip())
        try:
            entries = json.loads(raw)
            if isinstance(entries, list):
                return entries
        except json.JSONDecodeError:
            pass
        return []


# Module-level singleton; replaced in main() when --llm is passed
_llm: Optional[OllamaClient] = None


def llm() -> Optional[OllamaClient]:
    return _llm


# ── Utilities ──────────────────────────────────────────────────

def entry_id(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()[:12]


def file_date(path: Path) -> str:
    return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).strftime("%Y-%m-%d")


def write_entry(
    date: str,
    time_str: str,
    source_type: str,
    content: str,
    extra: Optional[dict] = None,
) -> Optional[Path]:
    content = content.strip()
    if not content:
        return None

    eid = entry_id(f"{date}{time_str}{source_type}{content[:200]}")
    filename = ENTRIES_DIR / f"{date}_{eid}.md"

    if filename.exists():
        return filename  # idempotent

    fm_lines = [
        f"id: {eid}",
        f"date: {date}",
        f'time: "{time_str}"',
        f"source_type: {source_type}",
        "tags: []",
    ]
    for k, v in (extra or {}).items():
        fm_lines.append(f"{k}: {json.dumps(v) if isinstance(v, (list, dict)) else v}")

    filename.write_text(
        f"---\n" + "\n".join(fm_lines) + f"\n---\n\n{content}\n",
        encoding="utf-8",
    )
    return filename


# ── Text extractors ────────────────────────────────────────────

def extract_pdf_text(path: Path) -> str:
    """Try pdfplumber first, fall back to pypdf, then placeholder."""
    text = ""

    try:
        import pdfplumber  # type: ignore
        with pdfplumber.open(path) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
        text = "\n\n".join(p for p in pages if p.strip())
    except ImportError:
        pass

    if not text:
        try:
            from pypdf import PdfReader  # type: ignore
            reader = PdfReader(str(path))
            pages = [page.extract_text() or "" for page in reader.pages]
            text = "\n\n".join(p for p in pages if p.strip())
        except ImportError:
            pass

    if not text:
        try:
            from pdfminer.high_level import extract_text  # type: ignore
            text = extract_text(str(path))
        except ImportError:
            pass

    if not text:
        return f"[PDF: {path.name} — install pdfplumber or pypdf to extract text]"

    client = llm()
    if client:
        print(f"    [llm] Cleaning PDF text for {path.name}…")
        text = client.clean_text(text, context="PDF document")

    return text


def strip_html(html: str) -> str:
    text = re.sub(r"<style[^>]*>.*?</style>", " ", html, flags=re.DOTALL)
    text = re.sub(r"<script[^>]*>.*?</script>", " ", text, flags=re.DOTALL)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    return re.sub(r"\s+", " ", text).strip()


# ── Format-specific ingestors ──────────────────────────────────

def ingest_pdf(path: Path, source_type: str = "files") -> int:
    text = extract_pdf_text(path)
    entry = write_entry(
        file_date(path), "00:00:00", source_type,
        f"# {path.stem}\n\n{text}",
        {"filename": path.name},
    )
    return 1 if entry else 0


def ingest_text_file(path: Path, source_type: str) -> int:
    content = path.read_text(encoding="utf-8", errors="replace").strip()

    client = llm()
    if client:
        # Try to split journals into individual dated entries
        fmt = client.detect_format(path, content)
        if fmt == "journal":
            print(f"    [llm] Splitting {path.name} into journal entries…")
            entries = client.split_journal_entries(content)
            if entries:
                count = 0
                for e in entries:
                    date = e.get("date", file_date(path))
                    if date == "unknown":
                        date = file_date(path)
                    time_str = e.get("time", "00:00:00")
                    text = str(e.get("text", "")).strip()
                    if text:
                        result = write_entry(date, time_str, source_type, text, {"filename": path.name})
                        if result:
                            count += 1
                if count:
                    return count
        elif fmt == "whatsapp":
            return ingest_whatsapp_txt(path)

    entry = write_entry(
        file_date(path), "00:00:00", source_type,
        f"# {path.stem}\n\n{content}",
        {"filename": path.name},
    )
    return 1 if entry else 0


def ingest_html_file(path: Path, source_type: str) -> int:
    raw = path.read_text(encoding="utf-8", errors="replace")
    content = strip_html(raw)

    client = llm()
    if client and content.strip():
        print(f"    [llm] Cleaning HTML text for {path.name}…")
        content = client.clean_text(content, context="HTML/web page")

    entry = write_entry(
        file_date(path), "00:00:00", source_type,
        f"# {path.stem}\n\n{content}",
        {"filename": path.name},
    )
    return 1 if entry else 0


def ingest_csv_file(path: Path, source_type: str) -> int:
    client = llm()
    count = 0
    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if client:
                non_empty = {k: v for k, v in row.items() if v and str(v).strip()}
                if non_empty:
                    text = client.summarise_csv_row(non_empty)
                else:
                    continue
            else:
                text = "\n".join(f"**{k}**: {v}" for k, v in row.items() if v and v.strip())

            if text.strip():
                result = write_entry(file_date(path), "00:00:00", source_type, text, {"filename": path.name})
                if result:
                    count += 1
    return count


def ingest_dayone_json(path: Path) -> int:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return 0

    entries = data.get("entries", [])
    count = 0
    for entry in entries:
        dt_str = entry.get("creationDate", "")
        try:
            dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
            date = dt.strftime("%Y-%m-%d")
            time_str = dt.strftime("%H:%M:%S")
        except Exception:
            date = file_date(path)
            time_str = "00:00:00"

        text = entry.get("text", "").strip()
        tags = [t.get("name", "") for t in entry.get("tags", [])]
        if text:
            result = write_entry(date, time_str, "dayone", text, {"tags": tags})
            if result:
                count += 1
    return count


def ingest_twitter_archive(root: Path) -> int:
    """Handle Twitter/X archive zip extracted directory."""
    tweet_js = root / "data" / "tweet.js"
    if not tweet_js.exists():
        for candidate in root.rglob("tweet.js"):
            tweet_js = candidate
            break
        else:
            return 0

    raw = tweet_js.read_text(encoding="utf-8")
    raw = re.sub(r"^window\.\w+\s*=\s*", "", raw).strip().rstrip(";")
    try:
        tweets = json.loads(raw)
    except json.JSONDecodeError:
        return 0

    count = 0
    for item in tweets:
        t = item.get("tweet", item)
        dt_str = t.get("created_at", "")
        try:
            dt = datetime.strptime(dt_str, "%a %b %d %H:%M:%S %z %Y")
            date = dt.strftime("%Y-%m-%d")
            time_str = dt.strftime("%H:%M:%S")
        except Exception:
            date = "1970-01-01"
            time_str = "00:00:00"
        text = t.get("full_text", t.get("text", "")).strip()
        if text and not text.startswith("RT @"):
            result = write_entry(date, time_str, "twitter", text)
            if result:
                count += 1
    return count


def ingest_whatsapp_txt(path: Path) -> int:
    """Parse WhatsApp exported chat .txt file."""
    content = path.read_text(encoding="utf-8", errors="replace")
    pattern = re.compile(
        r"[\[\(]?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)[\]\)]?\s*[-–]\s*([^:]+):\s*(.+)"
    )

    days: dict[str, list[str]] = {}
    for line in content.splitlines():
        m = pattern.match(line.strip())
        if m:
            raw_date, _, sender, message = m.groups()
            parts = re.split(r"[\/\-]", raw_date)
            try:
                if len(parts[2]) == 2:
                    parts[2] = "20" + parts[2]
                date = f"{parts[2]}-{int(parts[1]):02d}-{int(parts[0]):02d}"
            except Exception:
                date = "1970-01-01"
            days.setdefault(date, []).append(f"**{sender.strip()}**: {message.strip()}")

    count = 0
    for date, messages in days.items():
        text = "\n".join(messages)
        result = write_entry(date, "00:00:00", "whatsapp", text, {"filename": path.name})
        if result:
            count += 1
    return count


# ── Directory dispatcher ───────────────────────────────────────

def ingest_file(path: Path, source_type: str) -> int:
    ext = path.suffix.lower()

    if source_type == "twitter" and path.name == "tweet.js":
        return ingest_twitter_archive(path.parent.parent if path.parent.name == "data" else path.parent)

    if source_type == "dayone" and ext == ".json":
        raw = path.read_text(encoding="utf-8", errors="replace")
        if '"entries"' in raw[:500]:
            return ingest_dayone_json(path)

    if source_type == "whatsapp" and ext == ".txt":
        return ingest_whatsapp_txt(path)

    if ext == ".pdf":
        return ingest_pdf(path, source_type)
    if ext in (".txt", ".md"):
        return ingest_text_file(path, source_type)
    if ext == ".html":
        return ingest_html_file(path, source_type)
    if ext in (".csv", ".tsv"):
        return ingest_csv_file(path, source_type)

    # Unknown extension — ask the LLM if available
    client = llm()
    if client:
        sample = ""
        try:
            sample = path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            pass
        if sample:
            fmt = client.detect_format(path, sample)
            print(f"    [llm] {path.name}: detected format '{fmt}'")
            if fmt == "dayone":
                return ingest_dayone_json(path)
            if fmt == "whatsapp":
                return ingest_whatsapp_txt(path)
            if fmt in ("journal", "notes"):
                return ingest_text_file(path, source_type)
            if fmt == "csv":
                return ingest_csv_file(path, source_type)

    return 0


def ingest_directory(dir_path: Path, source_type: str) -> int:
    count = 0
    for item in sorted(dir_path.rglob("*")):
        if not item.is_file():
            continue
        if item.name.startswith("."):
            continue

        if item.suffix.lower() == ".zip":
            extract_dir = item.parent / (item.stem + "_extracted")
            if not extract_dir.exists():
                print(f"    Extracting {item.name}…")
                with zipfile.ZipFile(item) as z:
                    for member in z.infolist():
                        member_path = os.path.join(extract_dir, member.filename)
                        if not os.path.abspath(member_path).startswith(
                            os.path.abspath(str(extract_dir))
                        ):
                            continue
                        z.extract(member, extract_dir)
            count += ingest_directory(extract_dir, source_type)
            continue

        n = ingest_file(item, source_type)
        if n:
            print(f"    ✓ {item.name} → {n} entr{'y' if n == 1 else 'ies'}")
        count += n
    return count


def generate_seed_articles() -> None:
    """Create starter wiki articles from raw entries and rebuild wiki index."""
    wiki_dir = ROOT / "wiki"
    wiki_dir.mkdir(parents=True, exist_ok=True)

    def split_raw_frontmatter(text: str) -> Optional[tuple[dict[str, str], str]]:
        if not text.startswith("---\n"):
            return None
        rest = text[4:]
        sep = rest.find("\n---\n")
        if sep == -1:
            return None
        fm_block = rest[:sep]
        body = rest[sep + 5 :].lstrip("\n")
        meta: dict[str, str] = {}
        for line in fm_block.splitlines():
            if line.startswith("id: "):
                meta["id"] = line[4:].strip()
            elif line.startswith("date: "):
                meta["date"] = line[6:].strip()
            elif line.startswith("source_type: "):
                meta["source_type"] = line[13:].strip()
        return meta, body

    def title_from_raw(body: str, stem: str) -> str:
        for line in body.splitlines():
            s = line.strip()
            if s.startswith("# "):
                return s[2:].strip()
            if s.startswith("#") and len(s) > 1 and not s.startswith("##"):
                return s.lstrip("#").strip()
        cleaned = stem.replace("_", " ").replace("-", " ")
        return cleaned.strip() or stem

    def parse_wiki_frontmatter(text: str) -> dict[str, str]:
        if not text.startswith("---\n"):
            return {}
        rest = text[4:]
        sep = rest.find("\n---\n")
        if sep == -1:
            return {}
        fm_block = rest[:sep]
        meta: dict[str, str] = {}
        for line in fm_block.splitlines():
            if line.startswith("title: "):
                v = line[7:].strip()
                if v.startswith('"'):
                    try:
                        meta["title"] = json.loads(v)
                    except json.JSONDecodeError:
                        meta["title"] = v.strip('"')
                else:
                    meta["title"] = v
            elif line.startswith("sources: "):
                meta["sources_raw"] = line[9:].strip()
        return meta

    def sources_cell(raw_src: str) -> str:
        m = re.search(r'"([0-9a-f]{12})"', raw_src)
        if m:
            return m.group(1)
        return raw_src.strip().strip("[]'\" ")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    for raw_path in sorted(ENTRIES_DIR.glob("*.md")):
        raw_text = raw_path.read_text(encoding="utf-8", errors="replace")
        parsed = split_raw_frontmatter(raw_text)
        if not parsed:
            continue
        meta, body = parsed
        entry_id_val = meta.get("id", "")
        date_val = meta.get("date", "")
        source_type = meta.get("source_type", "unknown")
        if not entry_id_val:
            continue
        safe_st = source_type.replace("/", "_").replace("\\", "_") or "unknown"
        out_dir = wiki_dir / safe_st
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"{raw_path.stem}.md"
        title = title_from_raw(body, raw_path.stem)
        if not out_path.exists():
            article = (
                "---\n"
                f"title: {json.dumps(title)}\n"
                "type: document\n"
                f"created: {date_val}\n"
                f"last_updated: {date_val}\n"
                "related: []\n"
                f'sources: ["{entry_id_val}"]\n'
                "---\n\n"
                f"{body}\n"
            )
            out_path.write_text(article, encoding="utf-8")

    index_lines = [
        "# Wiki Index",
        "",
        f"Last rebuilt: {today}",
        "",
        "## Articles",
        "",
        "| Title | Category | Sources |",
        "|-------|----------|---------|",
    ]
    for md_path in sorted(wiki_dir.rglob("*.md")):
        if md_path.name == "_index.md":
            continue
        wtext = md_path.read_text(encoding="utf-8", errors="replace")
        wmeta = parse_wiki_frontmatter(wtext)
        wtitle = wmeta.get("title", md_path.stem.replace("_", " ").replace("-", " "))
        category = md_path.parent.name if md_path.parent != wiki_dir else ""
        src_raw = wmeta.get("sources_raw", "")
        sid = sources_cell(src_raw) if src_raw else ""
        index_lines.append(f"| [[{wtitle}]] | {category} | {sid} |")

    (wiki_dir / "_index.md").write_text("\n".join(index_lines) + "\n", encoding="utf-8")
    (wiki_dir / "_backlinks.json").write_text("{}", encoding="utf-8")


# ── Main ───────────────────────────────────────────────────────

def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Ingest files from data/ into raw/entries/",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python ingest.py                        # rule-based only\n"
            "  python ingest.py --llm                  # LLM-enhanced (llama3.2)\n"
            "  python ingest.py --llm --model mistral  # use a different Ollama model\n"
            "  python ingest.py --llm --ollama-url http://192.168.1.5:11434\n"
        ),
    )
    parser.add_argument(
        "--llm",
        action="store_true",
        help="Use a local Ollama model to improve parsing accuracy.",
    )
    parser.add_argument(
        "--model",
        default="llama3.2",
        metavar="MODEL",
        help="Ollama model name to use (default: llama3.2).",
    )
    parser.add_argument(
        "--ollama-url",
        default=OLLAMA_BASE,
        metavar="URL",
        help=f"Ollama server base URL (default: {OLLAMA_BASE}).",
    )
    return parser.parse_args()


def main() -> None:
    global _llm

    args = _parse_args()

    if args.llm:
        _llm = OllamaClient(model=args.model, base_url=args.ollama_url)
        print(f"[llm] LLM mode enabled — model: {args.model} @ {args.ollama_url}")
        # Probe availability early so the user sees the warning upfront
        _llm.is_available()

    if not DATA_DIR.exists():
        print("No data/ directory found. Drop files in data/ and re-run.")
        return

    before = len(list(ENTRIES_DIR.glob("*.md")))
    total = 0

    for source_dir in sorted(DATA_DIR.iterdir()):
        if not source_dir.is_dir() or source_dir.name.startswith("."):
            continue
        print(f"\n→ {source_dir.name}/")
        n = ingest_directory(source_dir, source_dir.name)
        total += n

    after = len(list(ENTRIES_DIR.glob("*.md")))
    new = after - before
    print(f"\n{'─' * 40}")
    print(f"Done. {new} new entr{'y' if new == 1 else 'ies'} created ({after} total in raw/entries/).")
    if new == 0 and total == 0:
        print("Tip: install pdfplumber for better PDF text extraction:  pip install pdfplumber")

    wiki_dir = ROOT / "wiki"
    wiki_article_count = 0
    if wiki_dir.exists():
        wiki_article_count = sum(
            1 for p in wiki_dir.rglob("*.md") if p.name != "_index.md"
        )
    if new > 0 or (after > 0 and wiki_article_count == 0):
        generate_seed_articles()


if __name__ == "__main__":
    main()
