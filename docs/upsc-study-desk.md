# UPSC study desk

The independent static module lives in `public/upsc/` and is published at `/upsc/` by the existing Vite → GitHub Pages workflow. The site's UPSC navigation item uses a full-page anchor; React Router must not intercept it. Vite copies the entire public directory to `dist/`.

The dashboard uses browser-local storage (`upsc-mentor-v1`). JSON imports are validated and merged by stable IDs; conflicting history is rejected. Each exported Markdown handoff embeds the complete JSON record so another AI can continue without access to earlier chats. Personal answers, backups and handoffs are not committed or included in the public kit. No server or shared-login sync is implemented.

## Edit materials

Edit the Markdown sources in `public/upsc/materials/`. Keep public guidance generic. The published HTML, PDFs and ZIP are committed static artifacts, so deployment needs only the existing npm build.

To refresh HTML, install Python-Markdown 3.9 in a tooling environment, then run:

```sh
python3 scripts/build-upsc-materials.py
```

Serve `public/` locally in another terminal:

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory public
```

With Playwright available to Node and Chromium installed (override its path with `UPSC_CHROMIUM_PATH` if needed), render the six PDF documents and package the public kit:

```sh
node scripts/make-upsc-pdfs.cjs http://127.0.0.1:8766
python3 scripts/build-upsc-materials.py --zip
```

The HTML renderer rewrites Markdown links to readable pages. PDF rendering opens answer-guide details for printing. ZIP packaging uses an explicit allowlist of public files; it never packages browser exports or the private onboarding record.

## Validate

Check `/upsc/`, all reading/PDF links and the downloadable ZIP in the production output. Exercise saving a session, an evidence-free assessment rejection, backup export, restoration in a fresh browser, duplicate/conflicting imports, a failed review and the handoff's embedded complete record. Confirm mobile layout, native navigation from the main site, and no personal profile in the public defaults. Keep test fixtures in temporary browser contexts.

Scheduled review stages are reminders, not mastery. A delayed successful review preserves the next spacing gap instead of clearing several stages on the same day. Earlier imported practice remains in the history without being relabelled as delayed recall.

The official exam guide records source-access limits. Check the applicable UPSC notice and degree recognition records before updating current rules or dates. This module provides study tools and original teaching materials; it does not republish copyrighted commercial books.
