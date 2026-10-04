# India, Before and After 2014

The collected edition contains six evidence volumes and a final UPA–NDA
comparison, by Lovepreet Singh. Evidence was checked on 2–3 October 2026;
the collected edition and web publication are dated 4 October 2026.

`content.json` is the complete structured manuscript export, including all
tables, explanatory prose, section citations and bibliographies. Each source
entry is `[organisation, title, dated note, URL, ...supplementary title/URL pairs]`.
Supplementary links may be nested `[title, URL]` tuples or flat pairs; both
importers retain each supplemental link.
`master-manifest.json` records the volume ranges and checksums.

Regenerate the web data with `node scripts/import-india-report.mjs`. The
importer changes the delivery-stage notes from planned to complete and turns
the original per-volume page references into web navigation. It preserves
the statistical content. Source numbers are local to each part.

The downloadable file is `public/india-before-and-after-2014-master.pdf`.
It has three new opening pages followed by the original 201 pages. All 201
pages were compared against the individual issued PDFs for identical text
and rendered pixels. All 903 original source links were retained, alongside
seven new contents links and 211 bookmarks. The issued volumes keep their
printed page numbers and original delivery-stage wording; the new opening
note explains this.

The final choice is a qualified editorial judgment under declared priorities,
not a causal estimate or an official score. The headline and summary must
retain the conditions and the stronger UPA cases discussed in the report.

## Complete Hindi edition

`content-hi.json` contains all seven translated parts, 170 sections, 152 data
tables and 289 source entries. Numerical values, observation dates, source
identities and URLs are retained. The research cutoff remains 2–3 October
2026; the translation is dated 4 October 2026. The old delivery-plan page is
replaced in the reading editions by the completed seven-part guide.

Regenerate the Hindi web data with `node scripts/import-india-report-hi.mjs`.
The existing language routes serve the landing page and all seven parts at
`/hi/writing/india-before-and-after-2014/`. The master download is
`public/india-before-and-after-2014-master-hi.pdf`; its verified page ranges,
links and SHA-256 are recorded in `master-hi-manifest.json`.

The Hindi PDF has its own pagination, a first-person opening note, a linked
chapter contents list, part bookmarks and the complete bibliographies. It
uses embedded Noto Serif Devanagari and the site's paper, ink and oxblood
palette. Tagged ActualText preserves Unicode alongside the shaped Hindi
glyphs. The original English and seven issued PDFs are unchanged. The web
importers also correct the rendering of nested supplemental source links in
the English bibliography without changing its evidence or tables.
