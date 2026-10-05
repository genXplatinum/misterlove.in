# Debunked: The Sikhism Series

The complete English edition was assembled on 5 October 2026. Parts 1–3 retain their original main text and publication dates. `original-parts-1-3.json` is the pre-completion reader data, preserved as a reproducible source. The importer adds a visible editorial notice pointing to the specific corrections in Part 13. The original collected PDF is preserved byte-for-byte as `public/debunked-sikhism-parts-1-3.pdf`.

Parts 4–13 are authored Markdown. `parts.json` supplies titles; `sources.json` supplies named public references. Bracketed reference keys generate numbered links. Each part has a foreword, ten claims, five ordered steps per claim, a closing and sources. The existing 6,000-word minimum and completeness checks remain in the importer.

`adapted-contexts.json` contains revised background readings from the author's already published Punjab history. Their original locations are linked in the reader. They are not independent corroboration. These adaptations qualify sweeping earlier claims about scripts, equality, motives, military totals, Partition and 1984; remove the original verdict panels; and retain a plain flowing explanation. The original Punjab series is not modified.

Rebuild the web data with `node scripts/import-debunked-sikhism.mjs`. An explicit folder argument additionally rereads the original three print-HTML files. The complete PDF combines a new edition note and linked contents, the three original English PDFs, and the newly typeset Parts 4–13. It does not include full copies of third-party research PDFs.
