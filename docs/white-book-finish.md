# White homepage book finish

22 October 2026. Release baseline: `a5f057d385bade71bdf4a24c0848eb8b04eb6d1f`.

The user approved publishing the pending refinements while excluding the proposed colour changes. All palette, logo, typography and layout changes from that proposal have been removed. The previous White palette and the Original edition are retained.

The sole new visual rule adds a faint diagonal varnish highlight and thin edge reflections to the existing homepage book object. It applies to the three subject covers. The highlight uses a pointer-transparent CSS pseudo-element, with no animation, JavaScript, new font, asset or dependency. Article prose, reading surfaces and publication artwork are unchanged.

The existing preservation guard also verifies that removing this single new rule yields the baseline stylesheet byte-for-byte after line-ending normalization. It rejects other source changes in this release.

Validation and deployment verification are recorded with the release artifacts under `C:/Users/rajpa/Documents/books/Why Athiest/output/white-release/book-finish/`.

Pre-deployment checks passed: Vite build, postbuild, lint and diff whitespace checks; 351 White routes, 345 preserved reader/collection bodies, 330 covers, and 301 exact selected-reader payloads. The content guard retained 43 manuscript files and 92 PDFs byte-for-byte. Lint retains the existing `import-sapiens-reading.mjs:360` warning.

The local HTTP check verified seven routes and ten exact assets, including the original logo files, restored White surface colours, app entry and stylesheets. At a 390px browser viewport all three topic controls selected the correct original-colour cover without horizontal overflow. The phone menu opened and closed, with edition switching inside it. The new highlight reports no animation. These checks use a desktop browser viewport, not a physical phone.

Rollback: revert this release commit if a cover becomes unreadable, subject controls stop responding, or the Original edition changes unexpectedly. No content or data migration is involved.
