# MisterLove: Original and White

## Approved release - 20 October 2026

The site has two editions: White is primary at `/`; Original is secondary at
`/original/`. Both have edition switches in their navigation and footer.
Switching retains the current article, language, query and anchor where the
destination exists. Original's About anchor maps to White's About page. Former
`/white/` URLs redirect to their matching primary routes, and `/observatory/`
redirects to the secondary Original homepage.

The Observatory interface, dedicated components, CSS, images and Three.js dependency have been removed. `/observatory/` remains only as a noindex redirect to Original so old bookmarks remain useful. Obsolete saved immersive preferences no longer affect landing pages.

A decorative branded opening screen uses the owner-approved `m.` and `misterlove.` outlines. It appears once per tab session, closes about 1.2 seconds after landing when loaded, and has a hard 1.95-second timeout. A tap or keypress dismisses it immediately. Reduced-motion visitors and visitors with JavaScript disabled see no blocking screen. The page stays available if loading fails.

## White design and covers

The Reading Room uses Manrope, a white canvas, an interactive research object, curated collections, a short reading, a book shelf and the author's method. Archive search and subject filters persist in the URL.

The publication cover system provides 330 collection/article/study covers across 22 visual identities, including translated editions. All published manuscript text, citations and existing PDFs retain their original bytes after normalizing only White navigation prefixes and validated cover decoration in generated HTML.

White routes use their primary root URLs as canonicals and remain indexable.
Original routes are `noindex, follow` and point to the matching White canonical;
the sitemap and RSS continue to describe only the primary routes. Brand artwork
is in `brand/misterlove/`, including the outlined SVGs, PNGs, avatars, licensed
fonts, tokens and reproducible scripts. Both editions retain their existing
visual design and use the official outlined `misterlove.` wordmark.

## Verification and preview

Run:

```powershell
npm.cmd run build
npm.cmd run lint
node scripts/test-brand-intro.mjs
node scripts/verify-white-premium.mjs
```

The production build verifies that White pages are generated at root, Original
pages at `/original/`, legacy edition URLs redirect correctly, canonical and
robots metadata match their roles, and the sitemap contains only primary URLs.
The White-edition verifier also compares generated manuscripts and checks
publication covers, reader links and PDF downloads.

Local production preview: `npm.cmd run preview -- --host 127.0.0.1 --port 5513 --strictPort`.
Development preview: `npm.cmd run dev -- --host 127.0.0.1 --port 5512 --strictPort`.

Design research: [24 award-recognized references](white-premium-research.html).
Review gallery: [all covers](white-cover-catalog.html).
The research board and initial preview reports describe the design-review stage; this release supersedes their earlier footer-only and three-edition assumptions.

## Release and rollback

The user explicitly authorized this release and GitHub push, then replaced the footer-only/Observatory-preservation constraint with two editions, a top switch and a short opening screen. No article or book publication is added in this release.

Deploy through the existing GitHub Pages workflow on `main`. Completion requires a successful workflow for the exact commit, live route/asset checks, representative browser checks, and public PDF hash comparisons. Roll back the focused release commit if an edition fails to open, published reader content differs, the opening screen cannot dismiss, or downloads change unexpectedly.
