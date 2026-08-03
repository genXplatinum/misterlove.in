/**
 * render-punjab-pdfs.mjs
 *
 * Renders the authored print HTML of "Punjab: The Whole Truth" to per-part
 * PDFs, one per part, into the book's own PDF folder.
 *
 * Parts 1 to 6 were originally rendered by WeasyPrint inside a Linux sandbox
 * that no longer exists, and this machine has no Python. Headless Chrome is
 * what is here, and on its own it is not enough: Blink implements none of the
 * page margin boxes the book relies on, so `@top-center` running heads and
 * `@bottom-center` page numbers simply vanish. paged.js is the polyfill that
 * implements those properly, so Chrome only has to print what it produces.
 *
 * Fonts are the other half. The book asks for Carlito and Bitstream Charter.
 * Neither is on Windows, and Bitstream Charter was not on the Linux box
 * either — WeasyPrint fell through to Century Schoolbook L. Both have exact
 * metric equivalents here, so they are aliased rather than substituted by
 * hand: the stylesheet still asks for the same faces and gets the same
 * measure, which is what keeps line breaks and page counts honest.
 *
 * Usage:
 *   node scripts/render-punjab-pdfs.mjs           # every part
 *   node scripts/render-punjab-pdfs.mjs 7 8 9     # only these
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const BOOK = 'C:/Users/rajpa/Documents/books/The Punjab Files';
const SRC = `${BOOK}/_source-html`;
const OUT = `${BOOK}/PDF`;
const SHARED_CSS = `${BOOK}/_build/book.css`;
const POLYFILL = 'node_modules/pagedjs/dist/paged.polyfill.js';
const PORT = 9333;

/* The filenames Parts 1 to 6 already use, which the binder reads in order. */
const NAMES = {
  1: 'The_Land_Before_the_Name',
  2: 'Porus_to_the_Huns',
  3: 'The_Invasion_Highway',
  4: 'Gurus_and_the_Khalsa',
  5: 'The_Sikh_Empire',
  6: 'Loyal_and_Rebel_at_Once',
  7: 'The_Cut',
  8: 'Redrawing_Punjab',
  9: 'Bhindranwale_Full_Autopsy',
  10: 'The_Dark_Decade',
  11: 'Khalistan_The_Idea_and_the_Network',
  12: 'The_Feasibility_Audit',
  13: 'The_Reckoning',
};

/* Aliases, not replacements: the book keeps asking for its own faces.
   Carlito is metric-compatible with Calibri by design, and C059 — what
   WeasyPrint actually set the body in — is a Century Schoolbook clone. */
const FONT_ALIASES = `
<style>
  @font-face { font-family: "Carlito"; src: local("Calibri"); }
  @font-face { font-family: "Carlito"; font-weight: bold; src: local("Calibri Bold"); }
  @font-face { font-family: "Carlito"; font-style: italic; src: local("Calibri Italic"); }
  @font-face { font-family: "Carlito"; font-weight: bold; font-style: italic; src: local("Calibri Bold Italic"); }
  @font-face { font-family: "Century Schoolbook L"; src: local("Century Schoolbook"); }
  @font-face { font-family: "Century Schoolbook L"; font-weight: bold; src: local("Century Schoolbook Bold"); }
  @font-face { font-family: "Century Schoolbook L"; font-style: italic; src: local("Century Schoolbook Italic"); }
  @font-face { font-family: "Century Schoolbook L"; font-weight: bold; font-style: italic; src: local("Century Schoolbook Bold Italic"); }
</style>`;

/* paged.js sets the running head and the page number as `::after` content on
   the margin boxes, so neither shows up in textContent. Counting the boxes
   that actually resolved to something is the only honest check. */
const HEADED_PAGES = `
  [...document.querySelectorAll('.pagedjs_page')].filter((page) => {
    const box = page.querySelector('.pagedjs_margin-top-center .pagedjs_margin-content');
    return box && getComputedStyle(box, '::after').content.replace(/^["']|["']$/g, '').trim();
  }).length`;

/* paged.js paginates asynchronously and its completion event is not reliably
   observable from here, so the printer waits for the page count to stop
   moving instead. Two identical readings a beat apart means it has settled. */
async function paginated(page) {
  let last = -1;
  let stable = 0;
  return waitFor(async () => {
    const { result } = await page.send('Runtime.evaluate', {
      expression: 'document.readyState === "complete"'
        + ' ? document.querySelectorAll(".pagedjs_page").length : 0',
      returnByValue: true,
    });
    const count = result.value;
    stable = count > 0 && count === last ? stable + 1 : 0;
    last = count;
    return stable >= 2 ? count : 0;
  }, { every: 500, what: 'pagination to settle' });
}

/* ------------------------------------------------------------------
   A very small Chrome DevTools Protocol client. Node 24 has WebSocket
   built in, so this needs nothing from npm.
   ------------------------------------------------------------------ */
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); }

  static async connect(url) {
    const ws = new WebSocket(url);
    const cdp = new CDP(ws);
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      const waiter = cdp.pending.get(message.id);
      if (!waiter) return;
      cdp.pending.delete(message.id);
      if (message.error) waiter.reject(new Error(message.error.message));
      else waiter.resolve(message.result);
    });
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', () => reject(new Error(`cannot reach ${url}`)), { once: true });
    });
    return cdp;
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  close() { this.ws.close(); }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(check, { tries = 600, every = 250, what = 'condition' } = {}) {
  for (let i = 0; i < tries; i += 1) {
    const value = await check();
    if (value) return value;
    await sleep(every);
  }
  throw new Error(`timed out waiting for ${what}`);
}

/* ------------------------------------------------------------------
   The page to print: the authored source, plus aliases and the polyfill.
   ------------------------------------------------------------------ */
async function preparePart(n, workDir) {
  const standalone = `${SRC}/part${n}_standalone.html`;
  const plain = `${SRC}/part${n}.html`;
  let html;
  if (existsSync(standalone)) {
    html = await readFile(standalone, 'utf8');
  } else if (existsSync(plain)) {
    /* Parts 1 to 6 were never given a standalone build, so the shared
       stylesheet is folded in here rather than left as a dead <link>. */
    const css = await readFile(SHARED_CSS, 'utf8');
    html = (await readFile(plain, 'utf8'))
      .replace(/<link[^>]+href="book\.css"[^>]*>/i, `<style>\n${css}\n</style>`);
    if (html.includes('book.css')) throw new Error(`part ${n}: book.css link not replaced`);
  } else {
    throw new Error(`part ${n}: no source at ${plain}`);
  }

  const polyfill = pathToFileURL(POLYFILL).href;
  const injected = `${FONT_ALIASES}\n<script src="${polyfill}"></script>\n</head>`;
  if (!/<\/head>/i.test(html)) throw new Error(`part ${n}: no </head> to inject into`);
  html = html.replace(/<\/head>/i, injected);

  const path = join(workDir, `part${n}.html`);
  await writeFile(path, html, 'utf8');
  return path;
}

/* ------------------------------------------------------------------
   Render.
   ------------------------------------------------------------------ */
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe']
  .find((p) => existsSync(p));
if (!chrome) throw new Error('Chrome not found; it is the renderer.');
if (!existsSync(POLYFILL)) throw new Error(`${POLYFILL} missing — run npm install`);

const wanted = process.argv.slice(2).map(Number).filter((n) => NAMES[n]);
const parts = wanted.length ? wanted : Object.keys(NAMES).map(Number);

const workDir = join(tmpdir(), `punjab-render-${process.pid}`);
const profile = join(workDir, 'profile');
await mkdir(profile, { recursive: true });

const browser = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--font-render-hinting=none',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: 'ignore' });

const rendered = [];
try {
  const version = await waitFor(
    () => fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json()).catch(() => null),
    { tries: 80, every: 250, what: 'Chrome to start' },
  );
  console.log(`  ${version.Browser}`);

  for (const n of parts) {
    const path = await preparePart(n, workDir);
    const target = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })
      .then((r) => r.json());
    const page = await CDP.connect(target.webSocketDebuggerUrl);
    try {
      await page.send('Page.enable');
      await page.send('Page.navigate', { url: pathToFileURL(path).href });

      const total = await paginated(page);

      /* `@page :first` clears the cover's head, so every other page carries
         one. Anything less means the paged-media rules did not take. */
      const { result: headed } = await page.send('Runtime.evaluate', {
        expression: HEADED_PAGES, returnByValue: true,
      });
      if (headed.value !== total - 1) {
        throw new Error(`part ${n}: ${headed.value} of ${total - 1} pages carry a running head`);
      }

      /* paged.js has already drawn the margins into each page box, so the
         sheet itself must be printed edge to edge or they would double. */
      const { data } = await page.send('Page.printToPDF', {
        printBackground: true,
        preferCSSPageSize: true,
        marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
      });

      const file = `Punjab_Part_${String(n).padStart(2, '0')}_${NAMES[n]}.pdf`;
      await writeFile(join(OUT, file), Buffer.from(data, 'base64'));
      console.log(`  Part ${String(n).padStart(2)} — ${String(total).padStart(3)} pp  ${file}`);
      rendered.push({ n, file, pages: total });
    } finally {
      page.close();
      await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`).catch(() => {});
    }
  }
} finally {
  browser.kill();
  await sleep(400);
  await rm(workDir, { recursive: true, force: true }).catch(() => {});
}

console.log(`✓ ${rendered.length} parts · ${rendered.reduce((s, r) => s + r.pages, 0)} pages`);
