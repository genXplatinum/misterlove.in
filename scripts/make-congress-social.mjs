/**
 * make-congress-social.mjs
 *
 * Social assets for "The Congress Record", rendered from the site's own card
 * design so the shared image and the shelf card are the same object.
 *
 * Produces, into the book folder:
 *   card-horizontal-1920x1080.png   the shelf card, landscape
 *   card-vertical-1080x1350.png     the shelf card, 4:5 feed post
 *   card-story-1080x1920.png        the shelf card, 9:16 story
 *   carousel-01..10.png             ten blunders, 4:5, made to swipe as one strip
 *
 * Every line on the carousel is taken from the book's own "Remember This"
 * summaries — the dates, counts and wordings are the ones the parts establish.
 * Nothing here is stronger than what the text can carry: a single invented
 * figure would hand the argument away, which is the point Part One makes.
 *
 * Usage:  node scripts/make-congress-social.mjs ["<output folder>"]
 */
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] ?? 'C:/Users/rajpa/Documents/books/Congress Files/social';

const FONTS = [
  resolve(ROOT, 'assets/fonts/og/Newsreader-Variable.ttf'),
  resolve(ROOT, 'assets/fonts/og/Inter-Variable.ttf'),
];
const missing = FONTS.filter((f) => !existsSync(f));
if (missing.length) {
  console.error(`Missing fonts:\n  ${missing.join('\n  ')}\nRun npm install first.`);
  process.exit(1);
}

/* ---------- palette: the site's own tokens ---------- */
const C = {
  canvas: '#F3EFE6',
  paper: '#FCFAF5',
  paperAlt: '#EAE2D5',
  ink: '#1D1A16',
  inkSoft: '#5E574D',
  rule: '#CFC5B6',
  ruleDark: '#A99D8D',
  oxblood: '#7C3032',
  brass: '#9A7742',
  // the Blight cover cloth
  cloth: '#2E0F12',
  cloth2: '#5C1A18',
  coverInk: '#F7E6E2',
  coverMuted: '#D8BCB5',
  foil: '#A8B638',
};

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* resvg exposes no text metrics, so wrapping is estimated. The factors are
   deliberately generous — a slightly early break is invisible, an overflow is
   not. */
const widthOf = (text, size, factor) => text.length * size * factor;

function wrap(text, maxWidth, size, factor = 0.5) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (widthOf(next, size, factor) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const lines = (arr, x, y, lh, cls, size, fill, extra = '') => arr
  .map((t, i) => `<text class="${cls}" x="${x}" y="${y + i * lh}" font-size="${size}" fill="${fill}" ${extra}>${esc(t)}</text>`)
  .join('');

const DEFS = `
  <defs>
    <linearGradient id="cloth" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.cloth}"/><stop offset="1" stop-color="${C.cloth2}"/>
    </linearGradient>
    <linearGradient id="clothWide" x1="0" y1="0" x2="1" y2="0.7">
      <stop offset="0" stop-color="#240B0E"/><stop offset="0.55" stop-color="${C.cloth}"/><stop offset="1" stop-color="${C.cloth2}"/>
    </linearGradient>
    <pattern id="fibre" width="34" height="34" patternUnits="userSpaceOnUse">
      <path d="M3 8h12 M23 26h8 M7 31h5 M27 5h4" stroke="#FFFFFF" stroke-opacity="0.03" stroke-width="1"/>
    </pattern>
    <pattern id="warp" width="3" height="3" patternUnits="userSpaceOnUse">
      <rect width="1" height="3" fill="#FFFFFF" fill-opacity="0.022"/>
    </pattern>
  </defs>
  <style>
    .r{font-family:'Newsreader',Georgia,serif}
    .s{font-family:'Inter','Segoe UI',sans-serif}
  </style>`;

/* ---------- the Blight cover plate, drawn at any size ---------- */
function coverPlate(x, y, w, h) {
  const pad = Math.round(w * 0.115);
  const kick = Math.max(11, Math.round(w * 0.032));
  const titleSize = Math.round(w * 0.132);
  const subSize = Math.round(w * 0.058);
  const badge = Math.max(10, Math.round(w * 0.030));
  const titleLines = wrap('The Congress Record', w - pad * 2, titleSize, 0.46);
  const subLines = wrap('What a Party Did With Seventy Years of Power', w - pad * 2, subSize, 0.47);
  const tY = y + pad + Math.round(h * 0.30);
  const sY = tY + titleLines.length * titleSize * 0.94 + subSize * 1.5;
  const badgeRuleY = y + h - pad - badge * 2.4;
  // At small plate heights the flowed rule would otherwise land on the badge.
  const ruleY = Math.min(
    sY + subLines.length * subSize * 1.35 + Math.round(h * 0.055),
    badgeRuleY - badge * 2.2
  );

  return `
  <g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#cloth)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#warp)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#fibre)"/>
    <rect x="${x + pad * 0.42}" y="${y + pad * 0.42}" width="${w - pad * 0.84}" height="${h - pad * 0.84}"
          fill="none" stroke="${C.coverMuted}" stroke-opacity="0.26" stroke-width="1"/>
    <text class="s" x="${x + pad}" y="${y + pad + kick}" font-size="${kick}" fill="${C.coverMuted}"
          font-weight="600" letter-spacing="${kick * 0.17}">A NINETEEN-PART AUDIT</text>
    ${lines(titleLines, x + pad, tY, titleSize * 0.94, 'r', titleSize, C.coverInk, 'font-weight="600" letter-spacing="-1.5"')}
    ${lines(subLines, x + pad, sY, subSize * 1.35, 'r', subSize, C.coverMuted, 'font-style="italic"')}
    <rect x="${x + pad}" y="${ruleY}" width="${Math.round(w * 0.30)}" height="1.6" fill="${C.foil}"/>
    <rect x="${x + pad}" y="${ruleY + 6}" width="${Math.round(w * 0.30)}" height="1.6" fill="${C.foil}" opacity="0.55"/>
    <rect x="${x + pad}" y="${badgeRuleY}" width="${w - pad * 2}" height="1" fill="${C.coverMuted}" opacity="0.4"/>
    <text class="s" x="${x + pad}" y="${y + h - pad - badge * 0.7}" font-size="${badge}" fill="${C.coverMuted}"
          font-weight="600" letter-spacing="${badge * 0.14}">19 PARTS · IN PROGRESS</text>
    <rect x="${x + w - pad * 2.6}" y="${y + h - pad - badge * 2.4}" width="1" height="0" fill="none"/>
  </g>`;
}

/* ---------- the shelf card, laid out for a given canvas ---------- */
function shareCard({ W, H, layout }) {
  const M = Math.round(Math.min(W, H) * (layout === 'h' ? 0.055 : 0.062));
  const cardX = M, cardY = M, cardW = W - M * 2, cardH = H - M * 2;
  const pad = Math.round(Math.min(W, H) * 0.055);

  /* The text column is measured first. In the stacked formats the cover then
     takes whatever height is left, so the meta row and the call to action can
     never be pushed off the card. */
  const horizontal = layout === 'h';
  const coverW = horizontal
    ? Math.round(cardW * 0.30)
    : Math.round(cardW * (layout === 'story' ? 0.60 : 0.54));
  const tx = horizontal ? cardX + pad + coverW + Math.round(pad * 1.15) : cardX + pad;
  const textW = horizontal ? cardX + cardW - pad - tx : cardW - pad * 2;

  const topicSize = Math.round(Math.min(W, H) * (horizontal ? 0.019 : 0.020));
  const titleSize = Math.round(Math.min(W, H) * (horizontal ? 0.088 : 0.078));
  const sumSize = Math.round(Math.min(W, H) * (horizontal ? 0.028 : 0.027));
  const metaSize = Math.round(Math.min(W, H) * (horizontal ? 0.019 : 0.019));

  const titleLines = wrap('The Congress Record', textW, titleSize, 0.455);
  const summary = 'An audit of what Congress governments did with power in India, from 1947 to the present day. Every charge carries a grade, every source is named, and the accusations that were invented are marked as invented.';
  const sumLines = wrap(summary, textW, sumSize, 0.485).slice(0, horizontal ? 5 : 6);

  const blockH = topicSize
    + titleLines.length * titleSize * 0.92 + sumSize * 1.1
    + sumLines.length * sumSize * 1.55 + metaSize * 2.2
    + metaSize * 3.5;

  let cover, colTop, colHeight;
  if (horizontal) {
    cover = coverPlate(cardX + pad, cardY + pad, coverW, cardH - pad * 2);
    colTop = cardY + pad;
    colHeight = cardH - pad * 2;
  } else {
    const gap = Math.round(pad * 0.95);
    const room = cardH - pad * 2 - blockH - gap;
    // keep the plate a book: never taller than 1.45× its width, never squat
    const coverH = Math.round(Math.max(coverW * 0.98, Math.min(room, coverW * 1.45)));
    cover = coverPlate(cardX + Math.round((cardW - coverW) / 2), cardY + pad, coverW, coverH);
    colTop = cardY + pad + coverH + gap;
    colHeight = cardY + cardH - pad - colTop;
  }

  const ty = Math.round(colTop + Math.max(0, (colHeight - blockH) / 2) + topicSize);

  const titleY = ty + topicSize + Math.round(titleSize * 0.92);
  const sumY = titleY + (titleLines.length - 1) * titleSize * 0.92 + Math.round(sumSize * 2.1);
  const metaY = sumY + sumLines.length * sumSize * 1.55 + Math.round(metaSize * 2.2);

  const meta = [['6 of 19', 'parts'], ['1,10,335', 'words'], ['~8.4', 'hrs']];
  let mx = tx;
  const metaSvg = meta.map(([big, small]) => {
    const g = `<text class="s" x="${mx}" y="${metaY}" font-size="${metaSize}" fill="${C.ink}" font-weight="700">${esc(big)}</text>`
      + `<text class="s" x="${mx + widthOf(big, metaSize, 0.60) + metaSize * 0.42}" y="${metaY}" font-size="${metaSize}" fill="${C.inkSoft}" font-weight="500">${esc(small)}</text>`;
    mx += widthOf(big, metaSize, 0.60) + widthOf(small, metaSize, 0.55) + metaSize * 2.6;
    return g;
  }).join('')
    + `<text class="s" x="${mx}" y="${metaY}" font-size="${metaSize}" fill="${C.oxblood}" font-weight="600">August 2026</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${DEFS}
  <rect width="${W}" height="${H}" fill="${C.canvas}"/>
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" fill="${C.paper}" stroke="${C.ruleDark}" stroke-width="1.4"/>
  ${cover}
  <text class="s" x="${tx}" y="${ty}" font-size="${topicSize}" fill="${C.oxblood}" font-weight="700" letter-spacing="${topicSize * 0.14}">INDIA · POLITICS · ACCOUNTABILITY</text>
  ${lines(titleLines, tx, titleY, titleSize * 0.92, 'r', titleSize, C.ink, 'font-weight="600" letter-spacing="-2.2"')}
  ${lines(sumLines, tx, sumY, sumSize * 1.55, 'r', sumSize, C.inkSoft)}
  ${metaSvg}
  <rect x="${tx}" y="${metaY + metaSize * 1.5}" width="${Math.round(textW * 0.22)}" height="1.4" fill="${C.brass}"/>
  <text class="s" x="${tx}" y="${metaY + metaSize * 3.5}" font-size="${metaSize * 1.05}" fill="${C.ink}" font-weight="700">Read this work  →</text>
  <text class="s" x="${cardX + cardW - pad}" y="${cardY + cardH - pad * 0.55}" text-anchor="end" font-size="${metaSize * 0.92}" fill="${C.ruleDark}" font-weight="600" letter-spacing="${metaSize * 0.12}">MISTERLOVE.IN</text>
</svg>`;
}

/* ---------- the blunders, each one the book's own finding ----------
   Two carousels of ten. Each set stands alone and is numbered from one, so
   either can be posted without the other. Every date, count and wording below
   is taken from the part named in the tag. */
const SET_A = [
  {
    tag: 'PART 02 · THE INHERITANCE', year: '1947',
    head: 'A man who had never seen India drew its border in five weeks.',
    body: 'One British lawyer with no experience of India divided two provinces in about five weeks. Four Indian judges deadlocked beside him, so every real decision was his.',
  },
  {
    tag: 'PART 02 · THE INHERITANCE', year: 'AUG 1947',
    head: 'The border was finished on the 12th. Nobody was shown it until the 17th.',
    body: 'The award was completed on 12 August and handed to the leaders on the 16th. It was published on the 17th — after Independence, after the crossings had begun.',
  },
  {
    tag: 'PART 02 · THE INHERITANCE', year: '1947–48',
    head: 'The dead have never been counted. The estimates run from 200,000 to 2 million.',
    body: 'The spread is a difference of method, not of opinion. Low figures count deaths reported to an administration. High figures use demography and testimony to count deaths that happened.',
  },
  {
    tag: 'PART 03 · THE CONSTITUTION', year: '1951',
    head: 'Two magazines won free-speech cases. Within a year the constitution was amended.',
    body: 'One communist, one Hindu nationalist. The First Amendment then added public order, friendly relations with foreign States, and incitement to an offence as grounds for restricting speech.',
  },
  {
    tag: 'PART 03 · THE CONSTITUTION', year: '1951 →',
    head: 'A list that puts a law beyond the reach of your fundamental rights.',
    body: 'The Ninth Schedule is a list, not a test. Anything Parliament puts in it cannot be struck down for violating fundamental rights. Thirteen land laws in 1951; more than 250 entries now, many with nothing to do with land.',
  },
  {
    tag: 'PART 04 · THE ECONOMIC MODEL', year: '1951–1991',
    head: 'You needed permission to exist. From the 1970s, permission to close.',
    body: 'A firm needed permission to exist, expand, relocate, change product, import a machine and obtain foreign currency. Delay selected for firms with the capital to wait years and the contacts to move a file.',
  },
  {
    tag: 'PART 04 · THE ECONOMIC MODEL', year: '1965 · 1967 · 1969',
    head: 'Three government committees found the system was doing the opposite of its purpose.',
    body: 'All appointed by the government. All found that licensing produced the concentration of economic power it existed to prevent — including large houses taking out licences they never used, to keep others out.',
  },
  {
    tag: 'PART 05 · THE MAP OF WHO GOT WHAT', year: '1952–1993',
    head: 'For forty-one years the centre paid to make location not matter.',
    body: 'Freight equalisation on coal, iron ore, steel and cement, so they cost the same everywhere. Location was the only thing the eastern states had. Cotton was not covered.',
  },
  {
    tag: 'PART 06 · CHINA, TIBET AND 1962', year: '29 APR 1954',
    head: 'India gave up its position in Tibet and reserved nothing on the border.',
    body: 'It surrendered its military escorts, its post and telegraph services, its rest houses and the status of its mission in Lhasa — and accepted the phrase “the Tibet Region of China” for the first time in a treaty.',
  },
  {
    tag: 'PART 06 · CHINA, TIBET AND 1962', year: '1955–1960',
    head: 'Four warnings. Nobody was punished for being right.',
    body: 'The army chief in 1955, the attaché in 1956, the Foreign Secretary in 1958, the reconnaissance pilot from 1960. The reports arrived, were noted, and connected to no decision — which is duller, and worse, than suppression.',
  },
];

const SET_B = [
  {
    tag: 'PART 02 · THE INHERITANCE', year: 'SEPT 1948',
    head: 'It counted the dead. Then it removed the count.',
    body: 'After the army entered Hyderabad, mass killing of Muslims followed. A committee appointed by Nehru himself put the toll, as a conservative floor, at 27,000 to 40,000 across nine of sixteen districts. The report was never published, no reason was ever given, and it reached the public in 2013.',
  },
  {
    tag: 'PART 02 · THE INHERITANCE', year: '1948',
    head: 'India went to the UN naming an aggressor. It came out as one of two parties to a dispute.',
    body: 'It filed under Article 35, in Chapter VI — the half of the Charter that recommends rather than orders. Its offer of a plebiscite, made as evidence of good faith, was converted into a condition. The line was drawn where the armies stood on 1 January 1949, by no principle at all. It is still there.',
  },
  {
    tag: 'PART 03 · THE CONSTITUTION', year: '1952',
    head: 'A man had to starve to death before the map was redrawn.',
    body: 'The government opposed linguistic states, then conceded Andhra after Potti Sriramulu died on the fifty-eighth day of a fast. Every later movement learned what that sequence taught.',
  },
  {
    tag: 'PART 03 · THE CONSTITUTION', year: '31 JULY 1959',
    head: 'Kerala elected a government. Twenty-seven months later Delhi dismissed it.',
    body: 'It had passed a serious tenancy law and an education law that removed patronage from powerful school managers. Nehru was reluctant and proposed fresh elections instead. Indira Gandhi, as Congress president, argued the other way.',
  },
  {
    tag: 'PART 03 · THE CONSTITUTION', year: '1951–1954',
    head: 'He ran the government and the party that was meant to check it — at the same time.',
    body: 'Patel died in December 1950; until then a decision had to survive two centres. In 1951 Nehru forced out a Congress president he had not wanted and took the party presidency himself while remaining Prime Minister, holding both until 1954.',
  },
  {
    tag: 'PART 04 · THE ECONOMIC MODEL', year: '1950–1991',
    head: 'Take away the unfair comparisons. India is still last.',
    body: 'The South Korea comparison is weak and this book concedes it — small, uniform, authoritarian, American-backed. Use only the fair ones: large, poor, plural, post-colonial. Pakistan is the closest comparison that exists, and it grew faster.',
  },
  {
    tag: 'PART 04 · THE ECONOMIC MODEL', year: 'JUNE 1991',
    head: 'Forty years of planning ended with two weeks of money left.',
    body: 'India’s reserves covered about two to three weeks of imports. The 1966 devaluation had been economically defensible and politically catastrophic, and the lesson taken from it — that opening the economy is fatal — held for twenty-five years.',
  },
  {
    tag: 'PART 05 · THE MAP OF WHO GOT WHAT', year: '1976',
    head: 'A notification left Punjab about a fifth of its own rivers.',
    body: 'In 1955 Rajasthan — not a riparian state to either river — had already received the largest single share, and undivided Punjab did not object. That concession belongs on the page. What followed did not need one.',
  },
  {
    tag: 'PART 06 · CHINA, TIBET AND 1962', year: 'OCT 1962',
    head: 'Sent up a ridge with 1895 rifles and canvas shoes.',
    body: '7 Infantry Brigade was placed at the bottom of a valley — overlooked, unacclimatised, unsupplied — and ordered to evict a force above it. The officers on the ground said it was hopeless. The order stood. On 25 October China offered a ceasefire and mutual withdrawal. India refused.',
  },
  {
    tag: 'PART 06 · CHINA, TIBET AND 1962', year: '1963 →',
    head: 'The report on 1962 is still secret — for its “current operational value”.',
    body: 'Two officers, April 1963, two typed copies. Its terms of reference excluded Army Headquarters and the civilian direction of the army. It concerns a war fought with bolt-action rifles. Every government since, of every party, has kept it closed.',
  },
];

/* The strip is meant to be swiped, so a bile rule runs edge to edge at the
   same height on every slide and the ledger of years advances along the foot:
   slide N ends where slide N+1 begins. */
function slide(item, i, set, W = 1080, H = 1350) {
  const n = i + 1;
  const total = set.length;
  const pad = 92;
  const railY = 300;                       // the continuous rule
  const numSize = 300;

  const headLines = wrap(item.head, W - pad * 2, 74, 0.475);
  const bodyLines = wrap(item.body, W - pad * 2, 33, 0.492);

  /* Centre the headline + detail in the field between the rule and the
     footer, so slides with a short headline do not leave a hole. */
  const fieldTop = railY + 64;
  const fieldBottom = H - 250;
  const blockH = headLines.length * 78 + 62 + bodyLines.length * 50;
  const headY = Math.round(fieldTop + Math.max(0, (fieldBottom - fieldTop - blockH) / 2) + 66);
  const bodyY = headY + headLines.length * 78 + 62;

  // the year ledger along the foot: the current one lit, its neighbours ghosted
  const ledger = set.map((b, k) => {
    const on = k === i;
    const x = pad + (k * (W - pad * 2)) / total;
    return `<rect x="${x}" y="${H - 150}" width="${(W - pad * 2) / total - 8}" height="${on ? 5 : 2}"
             fill="${on ? C.foil : C.coverMuted}" opacity="${on ? 1 : 0.28}"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${DEFS}
  <rect width="${W}" height="${H}" fill="url(#clothWide)"/>
  <rect width="${W}" height="${H}" fill="url(#warp)"/>
  <rect width="${W}" height="${H}" fill="url(#fibre)"/>

  <!-- the giant index, bled off the left edge so the eye is pulled onward -->
  <text class="r" x="${-18}" y="${railY - 44}" font-size="${numSize}" fill="${C.coverInk}" fill-opacity="0.055"
        font-weight="600">${String(n).padStart(2, '0')}</text>

  <text class="s" x="${pad}" y="${pad + 26}" font-size="21" fill="${C.foil}" font-weight="700" letter-spacing="3.4">THE CONGRESS RECORD</text>
  <text class="s" x="${W - pad}" y="${pad + 26}" text-anchor="end" font-size="21" fill="${C.coverMuted}" font-weight="600" letter-spacing="2.2" opacity="0.75">${String(n).padStart(2, '0')} / ${total}</text>

  <text class="s" x="${pad}" y="${railY - 34}" font-size="27" fill="${C.coverInk}" font-weight="700" letter-spacing="2.6">${esc(item.year)}</text>
  <!-- continuous rule: full-bleed, identical Y on every slide -->
  <rect x="0" y="${railY}" width="${W}" height="2" fill="${C.foil}" opacity="0.85"/>

  ${lines(headLines, pad, headY, 78, 'r', 74, C.coverInk, 'font-weight="600" letter-spacing="-1.6"')}
  ${lines(bodyLines, pad, bodyY, 50, 'r', 33, C.coverMuted)}

  <text class="s" x="${pad}" y="${H - 196}" font-size="19" fill="${C.foil}" font-weight="700" letter-spacing="2.6">${esc(item.tag)}</text>
  ${ledger}
  <text class="s" x="${pad}" y="${H - 66}" font-size="20" fill="${C.coverMuted}" font-weight="600" letter-spacing="2" opacity="0.8">${n === total ? 'READ ALL NINETEEN PARTS →' : 'SWIPE →'}</text>
  <text class="s" x="${W - pad}" y="${H - 66}" text-anchor="end" font-size="20" fill="${C.coverMuted}" font-weight="600" letter-spacing="2" opacity="0.55">MISTERLOVE.IN</text>
</svg>`;
}

/* Set C — the cost. What the decisions in Parts 2–6 did to people and to the
   country: the tolls first, then the consequences. The named scandals people
   expect here (Bofors, spectrum, coal, the Emergency's sterilisations) belong
   to Parts 9, 12, 15 and 16, which are not written yet — so there is nothing
   sourced to put on a card, and nothing goes on a card unsourced. */
const SET_C = [
  {
    tag: 'PART 02 · THE INHERITANCE', year: '1947',
    head: 'Somewhere between 200,000 and 2,000,000 people were killed.',
    body: 'The spread is not a disagreement of opinion but of method: low figures count deaths reported to an administration, high figures use demography and testimony to count deaths that happened. The count was never properly made, and now cannot be.',
  },
  {
    tag: 'PART 02 · THE INHERITANCE', year: 'OCT–NOV 1947',
    head: 'Between 20,000 and 100,000 killed in Jammu in a matter of weeks.',
    body: 'Large numbers of Muslims in Jammu province were killed or driven into West Punjab. Hindus and Sikhs were killed at Rajouri and Mirpur. How many died in Jammu in those two months remains, in the book’s own words, genuinely unknown.',
  },
  {
    tag: 'PART 02 · THE INHERITANCE', year: 'SEPT 1948',
    head: '27,000 to 40,000 — and that was only nine of sixteen districts.',
    body: 'The committee Nehru appointed called its own figure a floor rather than an estimate, and it covered barely half the districts. The true number was never established, because the report was never published and reached the public only in 2013.',
  },
  {
    tag: 'PART 06 · CHINA, TIBET AND 1962', year: 'OCT–NOV 1962',
    head: '1,383 killed. 1,696 never accounted for. 3,968 taken prisoner.',
    body: 'Nearly three men were captured for every one killed — the signature of a force put where it could not fight rather than one that fought and lost. Almost no territory changed hands.',
  },
  {
    tag: 'PART 04 · THE ECONOMIC MODEL', year: '1951–1991',
    head: 'A licence was an asset. Its value was everybody else’s exclusion.',
    body: 'That follows from the design and requires nobody to be corrupt. The Dutt committee found large houses taking out licences they never used — buying a market and never entering it, legally, for the price of an application.',
  },
  {
    tag: 'PART 04 · THE ECONOMIC MODEL', year: '1950–1980',
    head: 'India grew at about 3.5%. Pakistan grew at about 5%.',
    body: 'Identical starting date, the same colonial inheritance, the same partition, comparable poverty and plurality. In any single year that gap is invisible. Sustained for thirty years, it survives every plausible revision to either figure.',
  },
  {
    tag: 'PART 04 · THE ECONOMIC MODEL', year: '1950–1990',
    head: 'The economy grew. Between 40 and 50 in every 100 Indians stayed poor.',
    body: 'India’s poverty rate held somewhere between 40 and 50 per cent through most of this period — a fact that sits alongside the growth figures rather than being explained by them. A country can grow steadily while a majority of its people do not.',
  },
  {
    tag: 'PART 04 · THE ECONOMIC MODEL', year: '1966',
    head: 'It ended with a foreign government’s hand on India’s grain supply.',
    body: 'Agriculture had been given a diagnosis that assumed it needed no money, at the moment population began growing at over 2 per cent a year — so output had to beat that line every year merely to stand still, and it did not reliably do so.',
  },
  {
    tag: 'PART 03 · THE CONSTITUTION', year: '1952 →',
    head: '45% of the vote. 74% of the seats. Enough to rewrite the constitution.',
    body: 'First-past-the-post against a divided opposition handed a party with 45 per cent of the vote the two-thirds majority required to amend the constitution — and Chapter One shows what was done with it within months. Congress never won 50 per cent of the vote in a general election.',
  },
  {
    tag: 'PART 03 · THE CONSTITUTION', year: '1950–1954',
    head: 'Every person who could tell the leadership it was wrong was gone.',
    body: 'Between 1950 and 1954 every figure with an independent base — dead, resigned or defeated — and nothing institutional replaced them. Part Six holds this chapter up against 1962 and asks what a government does when no one left can contradict it.',
  },
];

/* ---------- render ---------- */
mkdirSync(OUT, { recursive: true });

function render(svg, file, width, dir = '') {
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Newsreader' },
  }).render().asPng();
  const folder = dir ? resolve(OUT, dir) : OUT;
  mkdirSync(folder, { recursive: true });
  writeFileSync(resolve(folder, file), png);
  console.log(`  ${(dir ? `${dir}/${file}` : file).padEnd(34)} ${String(Math.round(png.length / 1024)).padStart(4)} KB`);
}

console.log(`The Congress Record — social assets → ${OUT}\n`);
render(shareCard({ W: 1920, H: 1080, layout: 'h' }), 'card-horizontal-1920x1080.png', 1920);
render(shareCard({ W: 1080, H: 1350, layout: 'v' }), 'card-vertical-1080x1350.png', 1080);
render(shareCard({ W: 1080, H: 1920, layout: 'story' }), 'card-story-1080x1920.png', 1080);
const SETS = [
  { name: 'carousel', items: SET_A, dir: '' },
  { name: 'carousel-b', items: SET_B, dir: '' },
  { name: 'cost', items: SET_C, dir: 'the-cost' },
];

let count = 3;
for (const { name, items, dir } of SETS) {
  console.log('');
  items.forEach((item, i) => {
    render(slide(item, i, items), `${name}-${String(i + 1).padStart(2, '0')}.png`, 1080, dir);
    count += 1;
  });
}
console.log(`\n✓ ${count} images written`);
