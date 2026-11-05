# Lovepreet Singh: Living Archive

The personal site and Living Archive of Lovepreet Singh. It brings together a
concise professional profile and long-form research on history, society,
religion, public policy and technology.

The White edition is the primary site at `/`. The earlier Original design is
preserved at `/original/`; both editions share the same publications and reader
routes.

## Architecture

- `src/App.jsx` defines Original's routes; `src/white/WhiteApp.jsx` defines
  White's routes.
- `src/pages/` contains the home, writing shelf, topic and article views.
- `src/sections/` contains the chapters of the homepage.
- `src/components/` contains shared interface, motion and 3D components.
- `src/data/site.js` contains profile and homepage content.
- `src/data/writing.js` and `src/data/writing/` contain the research catalogue
  and individual publications.
- `src/index.css` holds global design tokens and shared styles.
- `scripts/` contains validation, social-card and static-output tools.
- `public/` contains images, PDFs and other static assets.

The build remains a React 19 and Vite application. It regenerates writing share
cards, crawlable pages for both editions, a sitemap, an RSS feed and static-host
fallbacks. Old `/white/` links redirect to the primary White routes.

## Local development

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run lint
npm run build
npm run preview
```

## Automatic social cards

Every production build creates:

- one card for the complete writing shelf;
- one card for each topic;
- one card for every published part; and
- equivalent cards for translated editions.

Adding a topic to `src/data/writing.js`, or a part to its publication file, is
enough. The normal build discovers it, creates the matching olive Living
Archive card and verifies that the final image exists at 1200×630 before the
site can deploy.

Use `npm run og` only when you want to refresh the cards without building the
whole site. The open-licensed renderer fonts live in `assets/fonts/og/`.
Production files are written to `dist/`.
