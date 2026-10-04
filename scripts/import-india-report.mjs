/**
 * Web edition of the seven completed India report-card volumes.
 * The source contains the authored prose and every table cell, rather than
 * lossy PDF extraction. This script changes only navigation/release notes
 * that belonged to a part-by-part PDF delivery, not statistical content.
 * Run: node scripts/import-india-report.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const sourceUrl = new URL('../assets/reports/india-before-and-after-2014/content.json', import.meta.url);
const source = JSON.parse(readFileSync(sourceUrl, 'utf8'));
const manifest = JSON.parse(readFileSync(new URL('../assets/reports/india-before-and-after-2014/master-manifest.json', import.meta.url), 'utf8'));
const info = [
  ['Economy', 'Money, Work and the Economy', 'Income, prices, work, banking, public money and trade: what changed, what each number counts, and where the comparisons need care.'],
  ['Infrastructure', 'The Networks of Everyday Life', 'Roads, trains, airports, electricity, taps, toilets, homes and digital access. A connection is a start; a working service is the result.'],
  ['People', 'Health, Learning and Living Conditions', 'Life expectancy, child and maternal deaths, nutrition, learning, poverty and household living conditions, with the survey years kept visible.'],
  ['Production', 'Making, Growing and Building', 'Farming, factories, steel, coal, electronics, startups, research, space and defence. Production, capacity, registrations and plans count different things.'],
  ['Public life', 'Safety, Institutions and the Environment', 'Crime, reporting, road deaths, suicide, police, courts, prisons, participation and the environment. A higher count needs an explanation.'],
  ['Comparison', 'States, Rankings and the Original Charts', 'State differences, international rankings and the original Matrix claims, checked for dates, definitions and changes in methods.'],
  ['Final comparison', 'Who Did Better: UPA or NDA?', 'A stated judgment, with its priorities and strongest objections: growth, delivery, freedom, COVID, other shocks and the limits of political credit.'],
];

const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (s) => String(s).replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const slugify = (s) => plain(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function editorialText(text) {
  return String(text)
    .replace('There is no final grade for the country here. I want you to finish with a clearer understanding of income, work, prices and public money, and enough information to form your own view.', 'This first volume explains income, work, prices and public money. The seventh part gives my final comparison of the two governments and states the priorities behind it. I want you to have enough information to understand that judgment and form your own view.')
    .replace('Part 6 is planned to extend the chart and ranking audit.', 'Part 6 extends the chart and ranking audit.')
    .replace('Part 1 is complete. This is Part 2. The remaining planned volumes cover health and education; farming and industry; crime, institutions and environment; and state differences and international rankings. Their figures are not silently folded into this volume.', 'This is Part 2 of the complete seven-part report. The other parts cover the economy; health and education; farming and industry; crime, institutions and environment; state differences and rankings; and the final UPA–NDA comparison.')
    .replace('Part 6 will examine those differences more closely; the next volume turns to farming, industry, science, space and defence.', 'Part 6 examines those differences more closely. Part 4 covers farming, industry, science, space and defence.')
    .replace('Parts 1 and 2 are separate completed volumes. Parts 4-6 are still planned.', 'All six evidence volumes and the final comparison are complete. The master PDF collects them together.')
    .replace('After six volumes, I did not want to leave you with a pile of numbers and no answer. You asked which government did better.', 'After six volumes, I did not want to leave you with a pile of numbers and no answer. The question was which government did better.')
    .replace(/<b>/g, '<strong>').replace(/<\/b>/g, '</strong>')
    .replace(/<i>/g, '<em>').replace(/<\/i>/g, '</em>');
}

function table(heads, rows) {
  return `<div class="w-table-scroll" role="region" aria-label="${escape(plain(heads.join(' · ')))}" tabindex="0"><table class="w-table w-table--india"><thead><tr>${heads.map(h => `<th scope="col">${editorialText(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((v, i) => i === 0 ? `<th scope="row">${editorialText(v)}</th>` : `<td>${editorialText(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

const parts = source.map((volume, index) => {
  const n = index + 1;
  const [label, title, lead] = info[index];
  const toc = [];
  let html = `<p class="w-note">The complete report has seven parts and one 204-page master PDF. The research cutoff for this part is ${n <= 2 ? '2' : '3'} October 2026. Every figure retains its own observation year. Page references in the original reading guide below refer to this volume’s printed pages within the master PDF; use the contents here to move through the web edition.</p>`;
  for (let i = 0; i < volume.pages.length; i++) {
    const page = volume.pages[i];
    const id = `india-${n}-${i + 1}-${slugify(page.title)}`;
    const heading = n === 1 && i === 1 ? 'Seven parts. One country.' : page.title;
    toc.push({ id, num: String(i + 1).padStart(2, '0'), text: plain(heading) });
    html += `<h2 class="w-h2" id="${id}">${escape(heading)}</h2>`;
    if (page.deck) html += `<p><em>${editorialText(page.deck).replace('Part 2 of the six-part India report card.', 'Part 2 of the seven-part India report card.')}</em></p>`;
    if (n === 1 && i === 1) {
      html += '<p>The six evidence volumes follow the same approach: show the earlier number, show the recent number, explain what changed, and make the limits visible. The seventh part draws the final comparison between the governments.</p>';
      html += table(['Part', 'What it covers', 'Original volume pages'], info.map((x,j) => [String(j+1), x[1], String(manifest.volumes[j].pages)]));
      html += '<p>All seven parts are complete and readable here. The master PDF contains the original 201 pages, plus a cover, an author’s note and linked contents. It is 204 pages in total. Each volume includes its own sources.</p><h3 class="w-h3">Inside Part 1</h3><p>This part covers the terms used in the comparisons, the economy, income, prices, wages, work, women’s participation, household spending, poverty, public money, banking, trade, debt, investment and the starting economic chart. Start at the beginning if the terms are new, or use the contents to find one subject.</p>';
    } else {
      for (const block of page.blocks) {
        if (block[0] === 'p') html += `<p>${editorialText(block[1])}</p>`;
        else if (block[0] === 'sub') html += `<h3 class="w-h3">${editorialText(block[1])}</h3>`;
        else if (block[0] === 'table') html += table(block[1], block[2]);
        else throw new Error(`Unsupported block ${block[0]}`);
      }
    }
    if (page.note) html += `<p class="w-note">${editorialText(page.note)}</p>`;
    if (page.refs?.length) {
      html += `<p class="w-note">Sources: ${page.refs.map(r => {
        if (!volume.sources[r - 1]) throw new Error(`Missing source ${n}:${r}`);
        return `<a href="#india-${n}-source-${r}" aria-label="Source ${r} for ${escape(plain(page.title))}">${r}</a>`;
      }).join(', ')}.</p>`;
    }
  }
  const sourcesId = `india-${n}-sources`;
  toc.push({ id:sourcesId, num:'S', text:'Sources and reading notes' });
  html += `<h2 class="w-h2" id="${sourcesId}">Sources and reading notes</h2><div class="prose--sources"><ol>`;
  volume.sources.forEach((entry,j) => {
    const [org,sourceTitle,note,url,...extra]=entry;
    if (!/^https?:\/\//.test(url)) throw new Error(`Invalid source URL ${url}`);
    html += `<li id="india-${n}-source-${j+1}"><strong>${escape(org)}.</strong> <a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(sourceTitle)}</a>. ${escape(note)}`;
    for (let k=0;k<extra.length;k+=2) html += ` <a href="${escape(extra[k+1])}" target="_blank" rel="noopener noreferrer">${escape(extra[k])}</a>.`;
    html += '</li>';
  });
  html += '</ol><p>The source list belongs to this part. Observation dates, report dates, definitions and comparability limits are explained beside the figures. The Matrix posts supplied the starting questions; their claims are checked against the cited evidence.</p></div>';
  const words = plain(html).split(/\s+/).filter(Boolean).length;
  return { n,label,title,lead,published:'2026-10-04',words,minutes:Math.ceil(words/220),toc,html };
});

const output=fileURLToPath(new URL('../src/data/writing/india-before-and-after-2014.js', import.meta.url));
writeFileSync(output, `/* Generated by scripts/import-india-report.mjs from the seven authored report volumes. */\nconst parts = ${JSON.stringify(parts,null,2)};\nexport default parts;\n`);
console.log(JSON.stringify({ parts:parts.length, words:parts.reduce((sum,p)=>sum+p.words,0), minutes:parts.reduce((sum,p)=>sum+p.minutes,0), perPart:parts.map(({n,words,minutes,toc})=>({n,words,minutes,sections:toc.length})) },null,2));
