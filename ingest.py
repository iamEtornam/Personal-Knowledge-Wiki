#!/usr/bin/env python3
"""
ingest.py — Convert files in data/ into raw entries in raw/entries/

One .md file per logical entry with YAML frontmatter:
  id, date, time, source_type, tags, plus source-specific fields.

Idempotent: running twice produces the same output.
"""

import csv
import hashlib
import json
import os
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).parent
DATA_DIR = ROOT / "data"
ENTRIES_DIR = ROOT / "raw" / "entries"
ENTRIES_DIR.mkdir(parents=True, exist_ok=True)


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
    try:
        import pdfplumber  # type: ignore
        with pdfplumber.open(path) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
        return "\n\n".join(p for p in pages if p.strip())
    except ImportError:
        pass

    try:
        from pypdf import PdfReader  # type: ignore
        reader = PdfReader(str(path))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(p for p in pages if p.strip())
    except ImportError:
        pass

    try:
        from pdfminer.high_level import extract_text  # type: ignore
        return extract_text(str(path))
    except ImportError:
        pass

    return f"[PDF: {path.name} — install pdfplumber or pypdf to extract text]"


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
    entry = write_entry(
        file_date(path), "00:00:00", source_type,
        f"# {path.stem}\n\n{content}",
        {"filename": path.name},
    )
    return 1 if entry else 0


def ingest_html_file(path: Path, source_type: str) -> int:
    raw = path.read_text(encoding="utf-8", errors="replace")
    content = strip_html(raw)
    entry = write_entry(
        file_date(path), "00:00:00", source_type,
        f"# {path.stem}\n\n{content}",
        {"filename": path.name},
    )
    return 1 if entry else 0


def ingest_csv_file(path: Path, source_type: str) -> int:
    count = 0
    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            text = "\n".join(f"**{k}**: {v}" for k, v in row.items() if v and v.strip())
            if text.strip():
                entry = write_entry(file_date(path), "00:00:00", source_type, text, {"filename": path.name})
                if entry:
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
        # Try alternate path
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
    # Pattern: [DD/MM/YYYY, HH:MM:SS] Name: Message  or  MM/DD/YY, HH:MM - Name: Message
    pattern = re.compile(
        r"[\[\(]?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)[\]\)]?\s*[-–]\s*([^:]+):\s*(.+)"
    )

    # Group messages by day
    days: dict[str, list[str]] = {}
    for line in content.splitlines():
        m = pattern.match(line.strip())
        if m:
            raw_date, _, sender, message = m.groups()
            # Normalize date
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
                    z.extractall(extract_dir)
            count += ingest_directory(extract_dir, source_type)
            continue

        n = ingest_file(item, source_type)
        if n:
            print(f"    ✓ {item.name} → {n} entr{'y' if n == 1 else 'ies'}")
        count += n
    return count


# ── Main ───────────────────────────────────────────────────────

def main() -> None:
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


if __name__ == "__main__":
    main()
