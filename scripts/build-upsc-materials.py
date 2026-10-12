"""Build the public UPSC reading library, or package its already-rendered PDFs.

Requires Python-Markdown 3.9 for HTML generation. Published files are static;
the normal Vite/Pages deployment does not need Python or a PDF renderer.
"""
from pathlib import Path
import argparse
import html
import os
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1] / "public" / "upsc"
MATERIALS = ROOT / "materials"
DOCUMENTS = [
    ("START-HERE.md", "start-here", "Start here", "How to use your study desk and keep your progress."),
    ("STUDY-PLAN.md", "study-plan", "Your complete programme", "A shared four-hour routine, first-month tasks and the longer preparation path."),
    ("lessons/00-starting-check.md", "starting-check", "Find your starting point", "Ten gentle reading, arithmetic and civics questions. Try before opening the answers."),
    ("lessons/01-rules-government-constitution.md", "lesson-01", "Lesson 1: rules and government", "Understand the Constitution through an everyday example, then explain it back."),
    ("AI-INSTRUCTIONS.md", "mentor-instructions", "Instructions for your AI mentor", "Teaching, assessment and logging rules that work across accounts."),
    ("research/official-exam-guide.md", "exam-guide", "Exam and eligibility guide", "The established exam structure, degree checks and official reference links."),
]
STYLES = """
:root{color-scheme:light;--ink:#193830;--muted:#52695f;--green:#226450;--line:#dce4dd;--paper:#f6f7f2}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.7 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
a{color:var(--green);text-underline-offset:3px}a:focus-visible,summary:focus-visible{outline:3px solid #b47720;outline-offset:4px}
header,main,footer{max-width:1020px;margin:auto;padding:24px}header{display:flex;gap:20px;justify-content:space-between;flex-wrap:wrap;border-bottom:1px solid var(--line)}
header a{font-size:14px;font-weight:650}main{padding-top:36px;padding-bottom:48px}.label{font-size:12px;text-transform:uppercase;letter-spacing:.12em;font-weight:750;color:var(--muted)}
h1{font-size:clamp(30px,5vw,44px);line-height:1.2;letter-spacing:-1.3px;margin:14px 0 24px}h2{font-size:25px;line-height:1.3;margin:38px 0 16px}h3{font-size:20px;margin-top:28px}p,ul,ol{margin:0 0 18px}li{margin:7px 0}
article{background:white;border:1px solid var(--line);border-radius:16px;padding:32px;overflow-wrap:anywhere}article h1:first-child{margin-top:0}
.actions{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0 28px}.button{display:inline-block;border:1px solid var(--line);background:white;padding:9px 15px;border-radius:9px;text-decoration:none;font-size:14px;font-weight:650}.button.primary{background:var(--green);color:white}
.intro{max-width:720px;color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.card{background:white;border:1px solid var(--line);border-radius:14px;padding:24px}.card h2{font-size:22px;margin:0 0 12px}.card p{font-size:15px;color:var(--muted)}.card .actions{margin-bottom:0}
table{display:block;max-width:100%;overflow-x:auto;border-collapse:collapse;font-size:14px;line-height:1.5;margin:20px 0 26px}th,td{padding:10px 12px;border:1px solid var(--line);text-align:left;vertical-align:top}th{background:#edf4ec}
blockquote{margin:22px 0;padding:16px 20px;border-left:4px solid #94b7a1;background:#f0f6ef}blockquote p:last-child{margin:0}details{border:1px solid var(--line);padding:16px;border-radius:10px;margin:24px 0}summary{font-weight:650;cursor:pointer}details[open] summary{margin-bottom:18px}
pre{background:#f0f4ef;padding:18px;border-radius:9px;overflow:auto;font-size:12px;line-height:1.6}code{font-family:ui-monospace,Consolas,monospace}hr{border:0;border-top:1px solid var(--line);margin:28px 0}.note{padding:18px;background:#edf4ec;border-radius:12px;font-size:14px}footer{font-size:13px;color:var(--muted);border-top:1px solid var(--line)}
@media(max-width:650px){header,main,footer{padding:20px}.grid{grid-template-columns:1fr}article{padding:20px;font-size:16px}h1{letter-spacing:-.7px}table{font-size:12px}}
@media print{@page{size:A4;margin:17mm 15mm 19mm}body{background:white;font-size:10pt;line-height:1.5}header,.actions,footer,.print-hide{display:none}main{max-width:none;padding:0}article{border:0;padding:0;border-radius:0}h1{font-size:23pt}h2{font-size:16pt;margin-top:20pt;break-after:avoid}h3{font-size:12pt;break-after:avoid}p,li{orphans:3;widows:3}table{display:table;table-layout:auto;width:100%;overflow:visible;font-size:8pt}th,td{padding:6px;overflow-wrap:anywhere}tr{break-inside:avoid}thead{display:table-header-group}blockquote,details{break-inside:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:7pt}a{color:inherit;text-decoration:none}.note{background:#f2f5ef}}
"""


def rewrite_links(body, source):
    known = {(MATERIALS / doc[0]).resolve(): doc[1] + ".html" for doc in DOCUMENTS}

    def replacement(match):
        href = html.unescape(match.group(1))
        if href in ("/upsc", "/upsc/"):
            href = "../index.html"
        elif href.startswith("/upsc/"):
            href = "../" + href[len("/upsc/"):]
        elif ":" not in href and not href.startswith(("#", "/")):
            base, mark, fragment = href.partition("#")
            target = (source.parent / base).resolve()
            if target in known:
                href = known[target] + (mark + fragment if mark else "")
            elif target.is_relative_to(ROOT):
                href = Path(os.path.relpath(target, MATERIALS)).as_posix() + (mark + fragment if mark else "")
        return 'href="' + html.escape(href, quote=True) + '"'

    return re.sub(r'href="([^"]+)"', replacement, body)


def shell(title, content):
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)} · UPSC Study Desk</title><link rel="stylesheet" href="reading.css"></head>
<body><header><a href="../index.html">← UPSC study desk</a><a href="index.html">All materials</a></header>
<main>{content}</main><footer>Learn one idea. Try an answer. Save the evidence. Public materials; personal progress stays in your browser and private exports.</footer></body></html>'''


def build():
    import markdown
    MATERIALS.mkdir(parents=True, exist_ok=True)
    (MATERIALS / "reading.css").write_text(STYLES.strip() + "\n")
    cards = []
    for filename, slug, title, description in DOCUMENTS:
        source = MATERIALS / filename
        body = markdown.markdown(source.read_text(), extensions=["extra", "sane_lists"])
        body = rewrite_links(body, source)
        links = f'<div class="actions"><a class="button primary" href="{slug}.pdf" download>Download PDF</a><a class="button" href="{filename}" download>Download source document</a></div>'
        (MATERIALS / (slug + ".html")).write_text(shell(title, '<p class="label">Your learning library</p>' + links + '<article>' + body + '</article>'))
        cards.append(f'<section class="card"><h2>{html.escape(title)}</h2><p>{html.escape(description)}</p><div class="actions"><a class="button primary" href="{slug}.html">Read online</a><a class="button" href="{slug}.pdf" download>PDF</a></div></section>')
    intro = '''<p class="label">UPSC Study Desk</p><h1>Everything you need to begin.</h1>
<p class="intro">A complete programme, a small starting check, your first lesson and instructions for any AI mentor. Read here, download a PDF, or keep the whole starter kit.</p>
<div class="actions"><a class="button primary" href="../index.html">Open your dashboard</a><a class="button" href="../downloads/upsc-study-kit.zip" download>Download the complete kit</a></div>'''
    sources = '''<h2>Official sources</h2><p>Use the actual examination notice and recognised-programme records before making eligibility or admission decisions. Official websites may need internet access.</p><ul>
<li><a href="https://upsc.gov.in/examinations/active-examinations">UPSC notifications</a> · <a href="https://upsc.gov.in/examinations/previous-question-papers">Previous question papers</a></li>
<li><a href="https://ncert.nic.in/textbook.php">NCERT textbooks</a></li><li><a href="https://www.ugc.gov.in/">UGC</a> · <a href="https://deb.ugc.ac.in/">UGC-DEB programme recognition</a></li><li><a href="https://ssc.gov.in/">SSC recruitment notices</a></li></ul>
<div class="note"><strong>Take your progress with you.</strong> This ZIP contains public study materials. Your personal answers and mentor history need a separate backup exported from the dashboard. Upload your latest handoff to a new AI to continue.</div>'''
    (MATERIALS / "index.html").write_text(shell("Materials library", intro + '<div class="grid">' + ''.join(cards) + '</div>' + sources))
    print(f"Built {len(DOCUMENTS)} reading pages and the materials library.")


def package():
    files = [ROOT / "index.html", MATERIALS / "index.html", MATERIALS / "reading.css"]
    for filename, slug, _, _ in DOCUMENTS:
        files.extend([MATERIALS / filename, MATERIALS / (slug + ".html"), MATERIALS / (slug + ".pdf")])
    for item in files:
        if not item.is_file():
            raise SystemExit(f"Missing public material: {item.relative_to(ROOT)}")
    out = ROOT / "downloads" / "upsc-study-kit.zip"
    out.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for item in files:
            archive.write(item, "upsc-study-kit/" + item.relative_to(ROOT).as_posix())
        archive.writestr("upsc-study-kit/READ-ME.txt", "Open index.html in your browser. Read materials/index.html for the library.\nThese are public starter materials, not a backup of your private study progress.\nExport your own JSON backup and AI handoff after each session.\n")
    print(f"Packaged {len(files) + 1} public files: {out.relative_to(ROOT)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--zip", action="store_true", help="Package public files after PDF rendering")
    args = parser.parse_args()
    package() if args.zip else build()
