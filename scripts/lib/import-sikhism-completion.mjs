import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const directory = resolve('content/debunked-sikhism');
const readJson = (name) => JSON.parse(readFileSync(resolve(directory, name), 'utf8'));
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const strip = (text) => text.replace(/<[^>]*>/g, ' ').replace(/&[\w#]+;/g, ' ').trim();

export const correctionNotice = '<p><strong>Complete-edition editorial note · 5 October 2026.</strong> This is the original published text. Part 13 corrects its ang 1136 attribution, qualifies categorical claims about unverified stories, and clarifies other overstatements. <a href="/writing/debunked-sikhism/part-13/#ds13-closing">Read the correction record before using these passages as settled findings.</a> The <a href="/debunked-sikhism-parts-1-3.pdf">original three-part PDF remains available as an archive</a>.</p>';

export function loadOriginalSikhismParts() {
  const originals = readJson('original-parts-1-3.json');
  if (originals.length !== 3) throw new Error('Expected three original Sikhism parts');
  return originals.map((part) => ({
    part: { ...part, prologue: correctionNotice + part.prologue },
    source: { path: 'content/debunked-sikhism/original-parts-1-3.json', chapters: 10, warnings: [] },
  }));
}

export function importSikhismCompletion() {
  const metadata = readJson('parts.json');
  const references = readJson('sources.json');
  const contexts = readJson('adapted-contexts.json');

  return metadata.map((meta) => {
    const path = resolve(directory, `part-${String(meta.n).padStart(2, '0')}.md`);
    const source = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
    if (source.includes('\uFFFD')) throw new Error(`${path}: replacement character`);
    const sections = source.split(/^# /m).slice(1);
    const used = [];
    const background = [];

    function cite(key) {
      const ref = references[key];
      if (!ref || !ref.url.startsWith('https://')) throw new Error(`${path}: invalid reference ${key}`);
      if (!used.includes(key)) used.push(key);
      return `<a class="w-cite" href="${escape(ref.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(ref.title)}">[Source ${used.indexOf(key) + 1}]</a>`;
    }

    function inline(text) {
      return escape(text).replace(/\[([A-Z][A-Z0-9-]*)\]/g, (_, key) => cite(key));
    }

    function blocks(text, { steps = false } = {}) {
      return text.trim().split(/\n\s*\n/).filter(Boolean).map((block) => {
        const reading = block.match(/^\[READ:([^:]+):(\d+):([^\]]+)\]$/);
        if (reading) {
          const [, slug, number, id] = reading;
          const context = contexts[id];
          if (!context || context.slug !== slug || context.part !== Number(number)) throw new Error(`${path}: missing background ${id}`);
          const url = `https://misterlove.in/writing/${slug}/part-${number}/#${id}`;
          if (!background.some((item) => item.url === url)) background.push({ url, title: `Author's earlier Punjab history, Part ${number}, ${id.replace(/^ph\d+-\d+-/, '').replace(/-/g, ' ')}` });
          return `<p class="w-source-note">Background adapted and revised from <a href="${url}">my earlier Punjab history, Part ${number}</a>. This is an explanation by the same author, not an independent primary witness; earlier overstatements are qualified in this adaptation.</p>${context.html}`;
        }
        if (block.startsWith('## ')) {
          const heading = block.slice(3).trim();
          const step = heading.match(/^([1-5])\. (.+)$/);
          if (steps) {
            if (!step) throw new Error(`${path}: unexpected step ${heading}`);
            return `<p class="w-step"><span class="w-step-n">${step[1]}</span><span class="w-step-t">${escape(step[2])}</span></p>`;
          }
          return `<h3 class="w-h3">${escape(heading)}</h3>`;
        }
        if (/^#/m.test(block) || /\[READ:/.test(block)) throw new Error(`${path}: unsupported block`);
        return `<p>${inline(block.replace(/\n/g, ' '))}</p>`;
      }).join('');
    }

    if (!sections[0]?.startsWith('Foreword\n') || !sections.at(-1)?.startsWith('Closing\n') || sections.length !== 12) throw new Error(`${path}: expected foreword, ten claims and closing`);
    const prologue = blocks(sections[0].slice('Foreword'.length))
      + '<p class="w-signature">Lovepreet Singh · MisterLove</p>'
      + `<blockquote class="w-pullquote"><p>Truthful living gives truth a place in conduct.</p><cite>Author's explanatory paraphrase of the emphasis on truthful conduct, Siri Raag, Guru Nanak Dev Ji, ang 62. ${cite('SGGS62')}</cite></blockquote>`;
    const toc = [];
    let html = '';
    sections.slice(1, -1).forEach((section, index) => {
      const match = section.match(/^Claim (\d{2}): (.+)\n([\s\S]+)$/);
      if (!match || Number(match[1]) !== index + 1) throw new Error(`${path}: claims must be numbered 01-10`);
      const [, num, title, body] = match;
      const id = `ds${meta.n}-${index + 1}-${slugify(title)}`;
      const firstStep = body.search(/^## 1\./m);
      if (firstStep < 0) throw new Error(`${path}: no first step`);
      const ordered = [...body.matchAll(/^## ([1-5])\. /gm)].map((m) => Number(m[1]));
      if (JSON.stringify(ordered) !== '[1,2,3,4,5]') throw new Error(`${path}: steps out of order in claim ${num}`);
      toc.push({ id, num, text: title });
      html += `<h2 class="w-h2" id="${id}"><span class="w-num">${num}</span>${escape(title)}</h2>`
        + `<div class="w-box w-box--claim"><span class="w-box-label">The claim</span>${blocks(body.slice(0, firstStep))}</div>`
        + blocks(body.slice(firstStep), { steps: true });
    });
    const closingId = `ds${meta.n}-closing`;
    toc.push({ id: closingId, num: '—', text: 'What this part establishes' });
    html += `<h2 class="w-h2" id="${closingId}">What this part establishes</h2>${blocks(sections.at(-1).slice('Closing'.length))}`;
    const words = strip(prologue + html).split(/\s+/).filter(Boolean).length;
    const sources = '<p>Research check: 5 October 2026. English explanations of Gurbani are the author’s paraphrases unless explicitly identified otherwise. Scripture, institutional code, historical testimony, scholarship, law and medical guidance answer different kinds of question.</p><ol>'
      + used.map((key) => `<li><a href="${escape(references[key].url)}" target="_blank" rel="noopener noreferrer">${escape(references[key].title)}</a></li>`).join('')
      + '</ol>' + (background.length ? '<h3 class="w-h3">Related writing by the author</h3><p>These background passages were adapted and revised for this edition; the original chapters remain available. They do not count as independent corroboration.</p><ul>' + background.map((ref) => `<li><a href="${ref.url}">${escape(ref.title)}</a></li>`).join('') + '</ul>' : '');
    return {
      part: { ...meta, words, minutes: Math.max(1, Math.round(words / 220)), published: '2026-10-05', displayDate: '5 October 2026', toc, prologue, prologueTitle: 'Foreword', prologueTag: `Foreword · The Sikhism Series, Part ${meta.n}`, html, sources },
      source: { path, chapters: 10, warnings: [] },
    };
  });
}
