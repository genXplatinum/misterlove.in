"""confessions-truth.py — dump the ground truth the PDF rebuild is checked against.

Parts 6 to 9 of "The Confessions, Explained" still have the Python content
modules they were rendered from; parts 1 to 5 do not, which is why the web
edition is rebuilt from the shipped PDFs. This writes the four surviving
modules' DOC token lists out as JSON so scripts/verify-confessions.mjs can
compare them with what the rebuild produces.

Copy this file into the book's own build directory (it imports the content
modules, which live beside the PDFs and not in this repository) and run it
from there:

    cd "C:/Users/rajpa/Documents/books/The Confessions/build"
    python confessions-truth.py "<repo>/tmp/truth.json"

The output is derived data holding the full text of four parts, so it stays
out of the repository; regenerate it whenever the check is run.
"""
import importlib
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

out = {}
for n in (6, 7, 8, 9):
    doc = []
    first = None
    for suffix in 'abcd':
        mod = importlib.import_module('content_p%d%s' % (n, suffix))
        if first is None:
            first = mod
        doc.extend(mod.DOC)
    out[str(n)] = {
        'cover': first.COVER,
        'running_head': first.RUNNING_HEAD,
        'doc': doc,
    }

with open(sys.argv[1], 'w', encoding='utf-8') as fh:
    json.dump(out, fh, ensure_ascii=False, indent=1)
print('parts:', ', '.join('%s=%d tokens' % (k, len(v['doc'])) for k, v in out.items()))
