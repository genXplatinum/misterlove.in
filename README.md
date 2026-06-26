# Lovepreet Singh — personal portfolio

A cinematic, interactive single-page portfolio for **Lovepreet Singh** — ethical
hacker, security architect and founder. Built as a dark "operations console" for
the security identity that opens into a light "business" act for the ventures.

> Standalone project — separate from the [Lovelace](https://lovelace.co.in) studio site.

## Concept — *Access Granted*
A secure-terminal boot sequence grants access, then walks through nine cinematic acts:
**Boot → Hero → Identity → Arsenal → Track Record** *(obsidian / dark)* →
**Ventures → Recognition → Journey** *(gallery / light)* → **Secure Channel** *(dark bookend)*.

Signatures: a live 3D **Sentinel Core** (obsidian core + reactive shield-field +
scan rings, with bloom), targeting-reticle cursor, live HUD status bar,
character-scramble "decrypt" text, magnetic CTAs, and dark⇄light scene bridges.

## Stack
- **React 19 + Vite**
- **react-three-fiber / drei / postprocessing** — the 3D hero + bloom
- **GSAP + ScrollTrigger** — scroll choreography & boot sequence
- **Lenis** — smooth scroll
- Custom CSS design system (no UI framework) with semantic dark/light tokens

## Run
```bash
npm install
npm run dev        # or double-click launch.cmd on Windows
```
Build: `npm run build` → static output in `dist/` (a `postbuild` step adds
`404.html` + `.nojekyll` for GitHub Pages / any static host).

## Editing content
**All copy lives in [`src/data/site.js`](src/data/site.js)** — profile, hero,
arsenal modules, track record, ventures, awards, journey and contact. The 3D
lives in `src/components/three/`; design tokens are at the top of `src/index.css`.

Drop a portrait at `public/founder.jpg` (already present) — it shows in the
Identity dossier, with an `LS` monogram fallback.

## Deploy
Auto-deploys via `.github/workflows/deploy.yml` on push to `main`.
`vite.config.js` derives `base` automatically: domain root when a `public/CNAME`
exists, otherwise the repo subpath on GitHub Actions, and `/` for local dev.
To use a custom domain (e.g. `lovepreetsingh.com`), add `public/CNAME` with the
domain and bind it in the repo's **Settings → Pages**.
