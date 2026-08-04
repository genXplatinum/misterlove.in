/**
 * render-punjab-history-pdf.mjs
 *
 * Renders a part of "The Complete History of Punjab" from its print source to
 * a PDF, for the parts whose PDF was never produced.
 *
 * Parts 1 to 11 and 14 were rendered by WeasyPrint inside a Linux sandbox that
 * no longer exists, and this machine has no working Python. This gets the same
 * result from what is here — headless Chrome, with paged.js supplying the
 * `@page` margin boxes Blink does not implement, so the running head and the
 * page numbers survive.
 *
 * The print sources load their fonts from `file:///home/claude/node_modules/`,
 * which was that sandbox's path. The same three families are npm packages —
 * the book's own publishing notes say so — so the URLs are rewritten to the
 * copies installed here. That matters more than it sounds: fall back to a
 * default face and the line breaks move, and with them every page number.
 *
 * Usage:
 *   node scripts/render-punjab-history-pdf.mjs part-13-print.html Punjab_History_Part_13_Partition_and_Indian_Punjab.pdf
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const BOOK = 'C:/Users/rajpa/Documents/books/Punjab history';
const POLYFILL = 'node_modules/pagedjs/dist/paged.polyfill.js';
const SANDBOX_FONTS = 'file:///home/claude/node_modules/';
const PORT = 9412;

const [source, target] = process.argv.slice(2);
if (!source || !target) throw new Error('usage: render-punjab-history-pdf.mjs <print.html> <out.pdf>');

const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe']
  .find((p) => existsSync(p));
if (!chrome) throw new Error('Chrome not found; it is the renderer.');
if (!existsSync(POLYFILL)) throw new Error(`${POLYFILL} missing — run npm install`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true });
      ws.addEventListener('error', () => rej(new Error(`cannot reach ${url}`)), { once: true });
    });
    return cdp;
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => this.pending.set(id, { resolve: res, reject: rej }));
  }
  close() { this.ws.close(); }
}

async function waitFor(check, { tries = 900, every = 500, what = 'condition' } = {}) {
  for (let i = 0; i < tries; i += 1) {
    const value = await check();
    if (value) return value;
    await sleep(every);
  }
  throw new Error(`timed out waiting for ${what}`);
}

/* Prepare: point the fonts at this machine and load the polyfill. */
const localFonts = pathToFileURL(resolve('node_modules')).href + '/';
let html = await readFile(join(BOOK, source), 'utf8');
const wanted = (html.match(new RegExp(SANDBOX_FONTS.replace(/[/]/g, '[/]'), 'g')) ?? []).length;
if (!wanted) throw new Error(`${source}: no sandbox font URLs to rewrite — check the source`);
html = html.replaceAll(SANDBOX_FONTS, localFonts);

/* A missing face silently reflows the whole book, so every one is checked. */
for (const url of [...html.matchAll(/url\('(file:[^']+\.woff2?)'\)/g)].map((m) => m[1])) {
  const path = decodeURIComponent(url.replace('file:///', ''));
  if (!existsSync(path)) throw new Error(`font not installed: ${path}`);
}

const polyfill = pathToFileURL(POLYFILL).href;
html = html.replace(/<\/head>/i, `<script src="${polyfill}"></script>\n</head>`);

const workDir = join(tmpdir(), `punjab-history-render-${process.pid}`);
const profile = join(workDir, 'profile');
await mkdir(profile, { recursive: true });
const page = join(workDir, 'page.html');
await writeFile(page, html, 'utf8');

const browser = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--font-render-hinting=none', '--allow-file-access-from-files',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });

try {
  await waitFor(() => fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json()).catch(() => null),
    { tries: 80, every: 250, what: 'Chrome to start' });

  const target_ = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' }).then((r) => r.json());
  const cdp = await CDP.connect(target_.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Page.navigate', { url: pathToFileURL(page).href });

  /* paged.js paginates asynchronously; wait for the count to stop moving. */
  let last = -1;
  let stable = 0;
  const pages = await waitFor(async () => {
    const { result } = await cdp.send('Runtime.evaluate', {
      expression: 'document.readyState === "complete" ? document.querySelectorAll(".pagedjs_page").length : 0',
      returnByValue: true,
    });
    stable = result.value > 0 && result.value === last ? stable + 1 : 0;
    last = result.value;
    return stable >= 2 ? result.value : 0;
  }, { what: 'pagination to settle' });

  /* The running head is the thing Chrome cannot do alone, so it is checked. */
  const { result: headed } = await cdp.send('Runtime.evaluate', {
    expression: `[...document.querySelectorAll('.pagedjs_page')].filter((p) => {
      const b = p.querySelector('.pagedjs_margin-top-center .pagedjs_margin-content');
      return b && getComputedStyle(b, '::after').content.replace(/^["']|["']$/g, '').trim();
    }).length`,
    returnByValue: true,
  });
  if (headed.value < pages - 3) {
    throw new Error(`only ${headed.value} of ${pages} pages carry a running head`);
  }

  const { data } = await cdp.send('Page.printToPDF', {
    printBackground: true,
    preferCSSPageSize: true,
    marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
  });
  await writeFile(join(BOOK, target), Buffer.from(data, 'base64'));
  console.log(`✓ ${target} — ${pages} pages, ${headed.value} with a running head`);
  cdp.close();
} finally {
  browser.kill();
  await sleep(400);
  await rm(workDir, { recursive: true, force: true }).catch(() => {});
}
