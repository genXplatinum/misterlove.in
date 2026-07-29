"""Export the completed Volume 2 ReportLab story as MisterLove article data.

The PDF generator already contains the authoritative prose, headings, tables,
callouts, citations, appendices, and source registry. This exporter traverses
those semantic flowables rather than scraping positioned text from the PDF.

Usage:
    python scripts/import-patriarchy-feminism-part2.py \
        --site-data "src/data/writing/patriarchy-feminism.js"
    python scripts/import-patriarchy-feminism-part2.py \
        --json-out "output/web/part-2.json"

Set PATRIARCHY_BOOK_ROOT when the book source is not in the default local path.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
from pathlib import Path
from typing import Iterable

from reportlab.graphics.shapes import Drawing
from reportlab.platypus import LongTable, Paragraph, Table

SCRIPT_ROOT = Path(__file__).resolve().parent
DEFAULT_BOOK_ROOT = (
    SCRIPT_ROOT
    if (SCRIPT_ROOT / "build_volume2.py").exists()
    else Path(r"C:\Users\rajpa\Documents\books\Patriarchy vs Matriarchy")
)
ROOT = Path(os.environ.get("PATRIARCHY_BOOK_ROOT", DEFAULT_BOOK_ROOT)).resolve()
sys.path.insert(0, str(ROOT))

import build_volume2 as volume  # noqa: E402


DEFAULT_JSON = ROOT / "output" / "web" / "patriarchy-feminism-part-2.json"


def slugify(value: str) -> str:
    value = html.unescape(value).lower()
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")[:90]


def inline_markup(value: str) -> str:
    """Translate ReportLab's small markup vocabulary to browser HTML."""
    value = str(value or "")
    value = re.sub(r"<bullet>.*?</bullet>", "", value, flags=re.I | re.S)
    value = re.sub(
        r'<link\s+href="([^"]+)"[^>]*>',
        lambda match: f'<a href="{html.escape(match.group(1), quote=True)}">',
        value,
        flags=re.I,
    )
    value = re.sub(r"</link>", "</a>", value, flags=re.I)
    value = re.sub(r"<super>", "<sup>", value, flags=re.I)
    value = re.sub(r"</super>", "</sup>", value, flags=re.I)
    value = re.sub(r'<a\s+name="([^"]+)"\s*/>', r'<span id="\1"></span>', value, flags=re.I)
    value = re.sub(r"<font\b[^>]*>", "", value, flags=re.I)
    value = re.sub(r"</font>", "", value, flags=re.I)
    return value.strip()


def plain(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", inline_markup(value))
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def paragraph_source(paragraph: Paragraph) -> str:
    return inline_markup(getattr(paragraph, "text", paragraph.getPlainText()))


def cell_markup(cell) -> str:
    if isinstance(cell, Paragraph):
        return paragraph_source(cell)
    if isinstance(cell, (list, tuple)):
        return "".join(
            f"<p>{cell_markup(item)}</p>" if isinstance(item, Paragraph) else cell_markup(item)
            for item in cell
        )
    return inline_markup(str(cell or ""))


def table_markup(table: Table | LongTable) -> str:
    rows = getattr(table, "_cellvalues", [])
    if not rows:
        return ""

    # info_box() is a one-row, two-column table whose second cell contains the
    # label, title, and body paragraphs.
    if len(rows) == 1 and len(rows[0]) == 2 and isinstance(rows[0][1], (list, tuple)):
        items = rows[0][1]
        label = cell_markup(items[0]) if len(items) > 0 else ""
        title = cell_markup(items[1]) if len(items) > 1 else ""
        body = cell_markup(items[2]) if len(items) > 2 else ""
        return (
            '<div class="w-box w-box--key">'
            f'<span class="w-box-label">{label}</span>'
            f"<p><strong>{title}</strong></p>"
            f"<p>{body}</p>"
            "</div>"
        )

    header, *body = rows
    head_html = "".join(f"<th>{cell_markup(cell)}</th>" for cell in header)
    body_html = "".join(
        "<tr>" + "".join(f"<td>{cell_markup(cell)}</td>" for cell in row) + "</tr>"
        for row in body
    )
    return (
        '<figure class="w-figure"><div class="w-table-scroll">'
        f'<table class="w-table"><thead><tr>{head_html}</tr></thead>'
        f"<tbody>{body_html}</tbody></table>"
        "</div></figure>"
    )


def drawing_markup(drawing: Drawing) -> str:
    if drawing.height < 230:
        return (
            '<div class="w-box w-box--key">'
            '<span class="w-box-label">POWER IS MULTI-DOMAIN</span>'
            "<p><strong>One visible office does not describe an entire society.</strong></p>"
            "<p>Property · Household · Law · Religion · Politics · Sexuality</p>"
            "</div>"
        )
    return (
        '<div class="w-box w-box--key">'
        '<span class="w-box-label">THE SIX-LAYER CAUSAL STACK</span>'
        "<p><strong>No layer is sufficient, and the arrows run in both directions.</strong></p>"
        "<ol>"
        "<li><b>Biology:</b> pregnancy, lactation, and average bodily differences.</li>"
        "<li><b>Tasks:</b> mobility, risk, timing, and compatibility with care.</li>"
        "<li><b>Resources:</b> land, herds, tools, and storable surplus.</li>"
        "<li><b>Kinship:</b> residence, descent, marriage, and inheritance.</li>"
        "<li><b>Coercion:</b> warriors, policing, and state capacity.</li>"
        "<li><b>Legitimation:</b> law, ritual, custom, education, and narrative.</li>"
        "</ol>"
        "</div>"
    )


def heading_markup(text: str, style: str, toc: list[dict]) -> str:
    text = plain(text)
    if style == "H1":
        chapter = re.match(r"^(\d+)\.\s*(.+)$", text)
        if chapter:
            number, title = chapter.groups()
            anchor = f"pf2-{number}-{slugify(title)}"
            toc.append({"id": anchor, "num": number, "text": title})
            return (
                f'<h2 class="w-h2" id="{anchor}">'
                f'<span class="w-num">{number}</span>{html.escape(title)}</h2>'
            )

        appendix = re.match(r"^Appendix\s+([A-D])\.\s*(.+)$", text, flags=re.I)
        if appendix:
            number, title = appendix.groups()
            anchor = f"pf2-appendix-{number.lower()}-{slugify(title)}"
            return (
                f'<h2 class="w-h2" id="{anchor}">'
                f'<span class="w-num">{number.upper()}</span>{html.escape(title)}</h2>'
            )

        return f'<h2 class="w-h2" id="pf2-{slugify(text)}">{html.escape(text)}</h2>'

    match = re.match(r"^((?:\d+\.\d+)|(?:D\.\d+))\s+(.+)$", text)
    if match:
        number, title = match.groups()
        anchor = f"pf2-{number.lower().replace('.', '-')}-{slugify(title)}"
        return (
            f'<h3 class="w-h3" id="{anchor}">'
            f'<span class="w-num">{html.escape(number)}</span>{html.escape(title)}</h3>'
        )
    return f'<h3 class="w-h3" id="pf2-{slugify(text)}">{html.escape(text)}</h3>'


def render_flowables(flowables: Iterable, toc: list[dict]) -> str:
    chunks: list[str] = []
    bullets: list[str] = []

    def flush_bullets() -> None:
        if bullets:
            chunks.append("<ul>" + "".join(f"<li>{item}</li>" for item in bullets) + "</ul>")
            bullets.clear()

    for flowable in flowables:
        if isinstance(flowable, Paragraph):
            style = flowable.style.name
            source = paragraph_source(flowable)

            if style == "BookBullet":
                bullets.append(source)
                continue
            flush_bullets()

            if style in {"H1", "H2"}:
                chunks.append(heading_markup(flowable.getPlainText(), style, toc))
            elif style == "H3":
                chunks.append(f'<h3 class="w-h3">{source}</h3>')
            elif style in {"Lead", "ChapterSubtitle"}:
                chunks.append(f'<p class="w-lead">{source}</p>')
            elif style == "Caption":
                chunks.append(f'<p class="w-caption"><em>{source}</em></p>')
            elif style not in {"ChapterNumber", "Ref"}:
                chunks.append(f"<p>{source}</p>")
        elif isinstance(flowable, (Table, LongTable)):
            flush_bullets()
            chunks.append(table_markup(flowable))
        elif isinstance(flowable, Drawing):
            flush_bullets()
            chunks.append(drawing_markup(flowable))

    flush_bullets()
    return "".join(chunk for chunk in chunks if chunk)


def render_sources(flowables: Iterable) -> tuple[str, int]:
    intro: list[str] = []
    records: list[str] = []
    closing: list[str] = []
    seen_reference = False

    for flowable in flowables:
        if isinstance(flowable, Paragraph) and flowable.style.name == "Ref":
            seen_reference = True
            source = paragraph_source(flowable)
            anchor = re.search(r'<span id="([^"]+)"></span>', source)
            source = re.sub(r'<span id="[^"]+"></span>', "", source, count=1)
            attr = f' id="{anchor.group(1)}"' if anchor else ""
            records.append(f"<li{attr}>{source}</li>")
        elif isinstance(flowable, Paragraph) and not seen_reference:
            if flowable.style.name in {"Lead", "BookBody"}:
                intro.append(f"<p>{paragraph_source(flowable)}</p>")
        elif seen_reference and isinstance(flowable, (Table, LongTable)):
            closing.append(table_markup(flowable))

    return "".join(intro) + "<ul>" + "".join(records) + "</ul>" + "".join(closing), len(records)


def find_paragraph(story: list, value: str) -> int:
    for index, flowable in enumerate(story):
        if isinstance(flowable, Paragraph) and flowable.getPlainText().strip() == value:
            return index
    raise ValueError(f"Could not find paragraph: {value}")


def count_words(markup: str) -> int:
    text = re.sub(r"<[^>]+>", " ", markup)
    text = html.unescape(text)
    return len(re.findall(r"\b[\w’'-]+\b", text, flags=re.UNICODE))


def build_part() -> dict:
    story = volume.build_story()
    author_start = find_paragraph(story, "Author's note")
    about_start = find_paragraph(story, "About the author")
    summary_start = find_paragraph(story, "Executive summary")
    first_chapter = next(
        i for i, flowable in enumerate(story)
        if type(flowable).__name__ == "ChapterRibbon" and getattr(flowable, "number", "") == "1"
    )
    source_start = find_paragraph(story, "Appendix E. Complete sources")

    toc: list[dict] = []
    author_note = render_flowables(story[author_start + 1 : about_start], [])
    summary = render_flowables(story[summary_start + 1 : first_chapter], [])
    prologue = author_note + '<h3 class="w-h3">Executive Summary</h3>' + summary
    article = render_flowables(story[first_chapter:source_start], toc)
    sources, source_count = render_sources(story[source_start + 1 :])
    words = count_words(prologue + article)

    if len(toc) != 17:
        raise RuntimeError(f"Expected 17 chapter entries, generated {len(toc)}")
    if source_count != len(volume.REFERENCES):
        raise RuntimeError(
            f"Expected {len(volume.REFERENCES)} source records, generated {source_count}"
        )
    if words < 25_000:
        raise RuntimeError(f"Exported article is unexpectedly short: {words:,} words")

    payload = json.dumps(
        {"toc": toc, "prologue": prologue, "html": article, "sources": sources},
        ensure_ascii=False,
    )
    if "\ufffd" in payload:
        raise RuntimeError("Replacement glyph found in web export")
    if re.search(r"<script\b|style\s*=|on\w+\s*=", payload, flags=re.I):
        raise RuntimeError("Unsafe markup found in web export")

    return {
        "n": 2,
        "label": "Origins & Change",
        "title": "How Patriarchal Institutions Emerged and Changed",
        "lead": (
            "Why patriarchal institutions became widespread, which mechanisms "
            "sustained them, and why their forms varied, weakened, or changed."
        ),
        "published": "2026-07-29",
        "words": words,
        "minutes": max(1, round(words / 220)),
        "pdf": "patriarchy-and-feminism-part-2.pdf",
        "pdfSize": "565 KB",
        "pdfLabel": "Part 2 PDF",
        "toc": toc,
        "prologue": prologue,
        "prologueTitle": "Author's Note & Executive Summary",
        "prologueTag": "A historical and cross-cultural investigation · July 2026",
        "html": article,
        "sources": sources,
    }


def write_json(part: dict, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(part, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def update_site_data(part: dict, output: Path) -> None:
    source = output.read_text(encoding="utf-8")
    match = re.search(
        r"const parts = (\[.*\]);\s*export default parts;\s*$",
        source,
        flags=re.S,
    )
    if not match:
        raise RuntimeError(f"Could not locate JSON parts array in {output}")

    parts = json.loads(match.group(1))
    parts = [existing for existing in parts if existing.get("n") != part["n"]]
    parts.append(part)
    parts.sort(key=lambda item: item["n"])
    total_words = sum(int(item.get("words", 0)) for item in parts)

    generated = f"""/* ============================================================
   PATRIARCHY & FEMINISM — PUBLISHED PARTS
   Part 1 was recovered from its authored PDF. Part 2 is exported
   from the semantic ReportLab source in build_volume2.py.
   Do not hand-edit: re-run the corresponding importer/exporter.

   {len(parts)} published parts · {total_words:,} words
   ============================================================ */

const parts = {json.dumps(parts, ensure_ascii=False, indent=2)};

export default parts;
"""
    output.write_text(generated, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json-out", type=Path, default=DEFAULT_JSON)
    parser.add_argument("--site-data", type=Path)
    args = parser.parse_args()

    part = build_part()
    write_json(part, args.json_out)
    if args.site_data:
        update_site_data(part, args.site_data)

    print(f"Created: {args.json_out}")
    if args.site_data:
        print(f"Updated: {args.site_data}")
    print(
        f"Part 2: {part['words']:,} words · {part['minutes']} min · "
        f"{len(part['toc'])} chapters · {len(volume.REFERENCES)} sources"
    )


if __name__ == "__main__":
    main()
