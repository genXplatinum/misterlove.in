# Loading and mobile performance

20 October 2026. Starting production release: `119ba1408aa130f93035db0f5144fbcc119e7b83`.

## What changed

- Readers now request one article or study plus a small contents index. Collection pages request the index alone. The Vite plugin derives these files from the unchanged checked manuscripts at build time.
- Original homepage code loads only on its own route, and its hero is ready before the page frame mounts. White no longer downloads it. The existing static page stays visible while the selected edition loads. Separate import statements prevent the build tool from combining both editions' preload lists.
- Each direct-entry page announces its own edition, page code and selected reader through module preloads. Sibling articles are not preloaded.
- The existing Google Fonts faces are served locally with the same font files, weights, styles and unicode ranges. White receives only its relevant Devanagari font declarations alongside its existing Manrope font. Font files include source URLs, SHA-256 hashes and the eight OFL licenses.
- Original's below-the-fold author photo loads near the viewport instead of competing with the opening text.

No visual stylesheet, article prose, source link, cover, PDF, route, edition-switch placement or intro timing was changed.

## Size evidence

The live baseline downloaded the complete series even when a reader opened one part:

| Tested article | Previous series JavaScript, decoded | Selected article JavaScript, decoded |
| --- | ---: | ---: |
| Why I Don't Believe, English Part 1 | 2,079,276 bytes | 46,660 bytes |
| The Rules About Women, Hindi Part 1 | 4,957,814 bytes | 321,438 bytes |

These figures describe manuscript delivery, not the entire page. Both new readers also load a small contents index and the shared application.

Using the same local gzip settings, the complete English source collection is 648,015 bytes and its selected article chunk is 15,280 bytes. The Hindi collection is 879,992 bytes and its selected article is 59,280 bytes. Server compression and network conditions can produce different transferred sizes.

## Verification

- Six live baseline pages were profiled at 390×844, with cache disabled, 150 ms latency, 1.6 Mbit/s download and 4× CPU throttling: both homes, both press indexes, an Original Hindi reader and a White English reader.
- Lab timings are diagnostic samples, not Lighthouse scores or field Core Web Vitals. Browser font caches, the intentional first-session intro and the static-to-React transition can affect paint measurements. In particular, an early paint of a loading state or footer is not the time at which a full article becomes readable.
- 301 built reader payloads deep-equal their original manuscripts. All 30 contents indexes retain the required metadata. Selected-article preloads are checked against the output manifest.
- Existing preservation checks pass: 43 manuscript source files, 92 unchanged PDFs, 345 static reader hashes, 330 covers and the edition/menu contracts.
- 27 mobile layout checks cover 19 representative routes at 390px and eight at 320px, including English, Hindi, Punjabi and book studies. Two desktop homepage checks at 1440px also pass. No unintended horizontal overflow or clipped text was found.
- The Original homepage heading retains exactly the same computed font family and bounding rectangle at the measured mobile viewport. Both editions retain their existing visual styles.
- Next/previous article transitions, both mobile menus, footer/menu edition switches, White archive search and language-specific readers were checked in Chromium.
- The full prebuild validators, production build, static publishers, intro tests, lint and diff checks are run before release. Lint retains the pre-existing `prefer-string-starts-ends-with` warning in `import-sapiens-reading.mjs`.

Browser checks use simulated mobile viewports; they do not substitute for physical iPhone/Android or Safari testing. Temporary network/CPU controls are restored after profiling.

## Maintenance

Use `npm run build` for a release, followed by `node scripts/verify-performance.mjs` and `node scripts/verify-white-premium.mjs`. Restart the development server after changing generated manuscript modules so the build-time reader catalogue is refreshed.

Font vendoring is a manual maintenance operation, not a network dependency of the build. `vendor-site-fonts.mjs` accepts the saved Google Fonts WOFF2 stylesheet; it preserves the face descriptors and downloads the matching licensed binaries. Do not substitute different font versions without visual review.

Production verification must confirm the completed Pages deployment, the new asset hashes, both editions, font requests and selected reader chunks before reporting release completion.
