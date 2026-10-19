# White edition

Published as a separate alternative for comparison on 19 October 2026, at the author's request. The Original and Observatory remain available. No default-edition change or scheduled promotion is configured.

- Entry: `/white/`, linked only from the existing footer.
- Other pages: `/white/writing/`, `/white/books/`, `/white/about/`, `/white/press/` and the existing reading paths prefixed with `/white`.
- Footer controls return to Original or Observatory. Opening White does not overwrite their theme or experience preferences.
- The shared research, source notes and public PDF files retain their original content and URLs. Reader links, contents and Hindi switches stay within White; downloads use the existing checked files.
- Design: white canvas, monochrome controls, self-hosted Manrope variable type, Noto Sans Devanagari for Hindi. Styles are scoped to `white-edition`.
- `scripts/postbuild-white.mjs` generates direct-entry HTML for the full route collection and builds the White social card from bundled OFL fonts. It verifies that the mirrored static manuscripts match their original pages after normalizing navigation URLs.
- This comparison edition uses `noindex, follow`; duplicate readers retain the original canonical URLs. It does not duplicate the sitemap or RSS feed.

Run `npm run build` and `npm run lint`. The regular postbuild includes White automatically. For local review, use Vite's preview server after building.

Publication checks cover route output, manuscript and public-asset preservation, mobile and desktop navigation, search and filtering, chapter/source jumps, language links, stored-preference isolation, Pages deployment, public PDF hashes and the independent social preview. A focused release commit can be reverted to remove the alternative if the author chooses another version.
