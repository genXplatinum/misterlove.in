/** Content-preservation and publication checks for the collected report. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import parts from '../src/data/writing/india-before-and-after-2014.js';
import { getPiece } from '../src/data/writing.js';

const source=JSON.parse(readFileSync(new URL('../assets/reports/india-before-and-after-2014/content.json',import.meta.url),'utf8'));
const manifest=JSON.parse(readFileSync(new URL('../assets/reports/india-before-and-after-2014/master-manifest.json',import.meta.url),'utf8'));
const piece=getPiece('india-before-and-after-2014');
const plain=(s)=>String(s).replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
const escaped=(s)=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
assert.equal(parts.length,7);
assert.equal(piece.parts,7);
assert.equal(piece.words,parts.reduce((sum,p)=>sum+p.words,0));
assert.equal(piece.minutes,parts.reduce((sum,p)=>sum+p.minutes,0));

let tables=0,cells=0,citations=0,sources=0,paragraphs=0;
for (let i=0;i<7;i++) {
  const part=parts[i],volume=source[i];
  const ids=[...part.html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,`Duplicate IDs in part ${i+1}`);
  for (const link of part.html.matchAll(/href="#([^"]+)"/g)) {
    assert(ids.includes(link[1]),`Missing target ${link[1]}`); citations++;
  }
  for (const entry of part.toc) assert(ids.includes(entry.id),`Missing contents target ${entry.id}`);
  assert.equal(part.words,plain(part.html).split(/\s+/).filter(Boolean).length);
  assert(!part.html.includes('w-box'),`Unexpected decorative boxes in part ${i+1}`);
  assert(!part.html.includes('still planned'),`Stale release note in part ${i+1}`);
  const headings=[...part.html.matchAll(/<h2[^>]*id="([^"]+)"[^>]*>/g)];
  for (let j=0;j<volume.pages.length;j++) {
    const section=part.html.slice(headings[j].index,headings[j+1].index);
    if (i===0 && j===1) continue; // The former six-volume plan is now a complete seven-part guide.
    const raw=volume.pages[j];
    const expected=raw.blocks.filter(b=>b[0]==='table');
    const actual=[...section.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)];
    assert.equal(actual.length,expected.length,`Table count ${i+1}:${j+1}`);
    expected.forEach((block,k)=>{
      const expectedCells=[...block[1],...block[2].flat()].map(plain);
      const actualCells=[...actual[k][1].matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/g)].map(m=>plain(m[1]));
      assert.deepEqual(actualCells,expectedCells,`Table data changed in ${i+1}:${j+1}`);
      tables++; cells+=actualCells.length;
    });
    for (const block of raw.blocks) if (block[0]==='p') {
      const text=plain(block[1]);
      // These four sentences refer to the original delivery process; the
      // importer explicitly updates them and leaves all other prose intact.
      const editorial=/There is no final grade|Part 6 is planned|remaining planned volumes|Part 6 will examine|You asked which government/.test(text);
      if (!editorial) { assert(plain(section).includes(text),`Missing prose ${i+1}:${j+1}: ${text.slice(0,70)}`); paragraphs++; }
    }
  }
  for (const entry of volume.sources) {
    assert(part.html.includes(`href="${escaped(entry[3])}"`),`Missing source URL ${entry[3]}`);
    assert(plain(part.html).includes(plain(escaped(entry[2]))),`Missing dated source note ${entry[1]}`);
    for (let k=4;k<entry.length;k++) {
      const supplemental=Array.isArray(entry[k])?entry[k]:[entry[k],entry[++k]];
      assert(/^https?:\/\//.test(supplemental[1]),'Invalid supplementary source URL');
      assert(part.html.includes(`href="${escaped(supplemental[1])}"`),`Missing supplementary source ${supplemental[1]}`);
    }
    sources++;
  }
}
for (const phrase of ['6.80%','6.06%','COVID','qualified','Congress-led UPA','BJP-led NDA','greatest weight']) {
  assert(plain(parts[6].html).includes(phrase),`Missing key comparison qualification ${phrase}`);
}
const pdf=readFileSync(new URL(`../public/${piece.pdf}`,import.meta.url));
assert.equal(createHash('sha256').update(pdf).digest('hex'),manifest.sha256);
assert.equal(pdf.length,manifest.bytes);
const distPdf=readFileSync(new URL(`../dist/${piece.pdf}`,import.meta.url));
assert.equal(createHash('sha256').update(distPdf).digest('hex'),manifest.sha256);
for (const part of parts) {
  const rendered=readFileSync(new URL(`../dist/writing/${piece.slug}/part-${part.n}/index.html`,import.meta.url),'utf8');
  assert(rendered.includes(part.html),`Incomplete pre-rendered article ${part.n}`);
  assert(rendered.includes(`https://misterlove.in/writing/${piece.slug}/part-${part.n}/`));
  assert(rendered.includes(piece.pdf));
}
const landing=readFileSync(new URL(`../dist/writing/${piece.slug}/index.html`,import.meta.url),'utf8');
const writing=readFileSync(new URL('../dist/writing/index.html',import.meta.url),'utf8');
const sitemap=readFileSync(new URL('../dist/sitemap.xml',import.meta.url),'utf8');
const feed=readFileSync(new URL('../dist/feed.xml',import.meta.url),'utf8');
assert(landing.includes(piece.pdf));
assert(writing.includes(piece.slug));
assert(sitemap.includes(`/writing/${piece.slug}/`));
for (const part of parts) {
  assert(sitemap.includes(`/writing/${piece.slug}/part-${part.n}/`));
  assert(feed.includes(`/writing/${piece.slug}/part-${part.n}/`));
}
console.log(JSON.stringify({parts:7,words:piece.words,preservedDataTables:tables,preservedTableCells:cells,preservedParagraphs:paragraphs,sourceEntries:sources,citationTargetsChecked:citations,pdfPages:manifest.pages,pdfBytes:pdf.length,pdfSha256:manifest.sha256,preRenderedParts:7,sitemapAndFeed:'passed'},null,2));
