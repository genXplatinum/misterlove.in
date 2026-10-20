# Website copy audit

20 October 2026. Baseline: `5bbdbc8af2f726da19830617a2833e8421a53542`.

The owner requested a site-wide edit of website text, with particular attention to `/white/press/`, excluding their articles. This pass covers Original and White homepages, About, Writing and Books listings, book-reading method, shared press index and entry framing, navigation/footer labels, loading/error states, reader controls, page descriptions and generated collection/share artwork.

The Humanizer skill guided the prose edit. The review looks for vague promotion, needless metaphors, exaggerated claims and awkward phrasing; it does not claim to determine who or what wrote a sentence.

## Changes

- Press: “Built to make a mark” becomes “Articles and mentions.” Display titles identify the actual item. The latest release and syndicated publisher links retain their press-release labels.
- Press archives: keep the distinction between a saved page, a directory entry, a release and independent reporting. Original headlines, source credits, dates, links, images and provenance remain intact.
- Home and About: use a direct first-person voice. Remove the stale “Five continuing investigations” count and simplify metaphor-heavy biography, education and studio copy.
- Writing and Books: explain what readers can find and how the studies work. Buttons name their destination or action. Book assumptions are explained in ordinary language.
- Shared interface: simplify edition, sharing, loading and diagram instructions where needed. Existing clear labels stay.
- Metadata and images: synchronize static and interactive page descriptions; regenerate the two collection cards and press post/story images affected by website copy.

## Preserved

Article and study manuscripts, titles, summaries, citations, publication counts, quotations, PDFs, source clipping images, biography facts, routes, link destinations, layouts, styles, logos and edition-switch behavior.

The homepage retains the author's quoted statement and the White headline “Leave no question unasked.”

## Verification

`node scripts/verify-site-copy.mjs` checks the source/PDF and publication-record boundaries against the baseline. `node scripts/verify-white-premium.mjs` also checks the generated routes, mirrored reader content, covers, canonicals and downloads.

The full build, language/content validators, press validation, lint and whitespace checks run before release. Browser review covers the press page at desktop/mobile sizes, filtering and a feature page, with representative home/About/Books screens. Publication is complete only after the Pages workflow succeeds and the live pages and generated assets match the checked build. Deployment evidence is stored outside the repository in the task's `output/white-release` folder.
