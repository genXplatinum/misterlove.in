# Author bookshop

The promotional catalog lives at `/my-books/`, with an equivalent White edition at `/white/my-books/`. Both site navigations link to **My Books**. The existing `/books/` close-reading shelf keeps its purpose and URLs.

## Catalog and verified destinations

Checked against a freshly reloaded Pothi author dashboard and the public store pages on 30 October 2026:

| Book | Printed pages | Public store |
| --- | ---: | --- |
| God Has an Evidence Problem | 410 | https://store.pothi.com/book/lovepreet-singh-god-has-evidence-problem/ |
| The Sacred Mirage, Book One | 208 | https://store.pothi.com/book/lovepreet-singh-the-sacred-mirage/ |
| DEBUNKED: ISLAM | 496 | Review pending; no public store URL or SKU assigned |

The first two books have Buy Now links and Pothi print-preview links. Purchase links open the public book detail page in a new tab; the website does not add anything to a cart. Pothi supplies current prices, shipping and checkout. The signed-in author prices were not copied into public marketing copy. God Has an Evidence Problem has a published listing while its revision remains under review.

DEBUNKED: ISLAM has a Coming Soon state and a link to the complete online book. Its signed-in author record is not a purchase destination. After Pothi approval, verify its actual public store URL, then update `src/data/myBooks.js` with that URL and `status: 'available'`. Update the availability assertions in `scripts/validate-my-books.mjs` to the newly verified state. No background job polls or changes this catalog.

## Approved artwork

- Sacred Mirage: `Why Athiest/output/book-1-english/Front-cover.jpg`, the approved Celestial Mirage version 3.
- God Has an Evidence Problem: the earlier campaign's `promotion/references/approved-front-cover.png`, approved G design.
- DEBUNKED: ISLAM: `output/pothi-publication/B-999-2026-10-30/Front-Cover-Preview.png`, approved B Human Fingerprints design.

The actual front images are served locally under `public/book-covers/`; the source books, PDF files and print wraps are unchanged. The first attempt to fetch Sacred Mirage's public thumbnail returned HTTP 403, so the approved local front was used. No third-party stock artwork or new mock cover is substituted.

## Production

`src/pages/MyBooks.jsx` is the shared component. `scripts/postbuild-my-books.mjs` renders it into both static routes, keeps White's existing noindex policy and canonical to the Original route, adds three-book structured data, includes the route styles, and puts the canonical route into the sitemap. The page is a catalog rather than a new research article, so the writing RSS entries are unchanged.

`scripts/make-my-books-card.mjs` creates the 1200 × 630 sharing image from all three approved covers and the bundled open-licensed fonts. The normal OG build and postbuild workflows include the catalog and its validation. `scripts/postbuild-performance.mjs` preloads this route's code on direct entry.

Validation completed before publication: all repository language and manuscript-preservation checks, production build, 49 catalog checks, lint with no errors (one pre-existing warning in the Sapiens importer), and diff whitespace checks. Browser checks cover phone, tablet and desktop, Original and White, loaded cover images, correct store destinations, reciprocal edition links and no horizontal overflow at the checked sizes. Release proof and live-verification records are saved outside the checkout in `../bookshop-release-2026-10-30/`.
