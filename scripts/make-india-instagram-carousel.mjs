/**
 * Ten connected, source-labelled Instagram slides for the India report.
 *
 * The figures below come from Part 7 of the published report, which points
 * back to the full tables and primary sources in Parts 1-6. Exact typography
 * is rendered here rather than baked into generated artwork.
 */
import { Resvg } from '@resvg/resvg-js';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 1080;
const H = 1350;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public', 'social', 'india-before-and-after-2014-carousel');
const ART = resolve(ROOT, 'assets', 'og', 'india-before-and-after-2014-art.png');
const FONTS = [
  resolve(ROOT, 'assets', 'fonts', 'og', 'Newsreader-Variable.ttf'),
  resolve(ROOT, 'assets', 'fonts', 'og', 'Inter-Variable.ttf'),
];

const missing = [...FONTS, ART].filter((file) => !existsSync(file));
if (missing.length) {
  throw new Error(`Missing carousel dependencies:\n${missing.join('\n')}`);
}

const artData = readFileSync(ART).toString('base64');
const esc = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const palette = {
  paper: '#f7f0e5',
  paperLight: '#fffaf1',
  ink: '#182126',
  text: '#31373a',
  muted: '#6c6861',
  rule: '#c8b9a6',
  upa: '#486d7a',
  upaSoft: '#dce8e9',
  nda: '#b65b2e',
  ndaSoft: '#f2dfd3',
  oxblood: '#8b4a35',
  white: '#fffdf8',
};

const textLines = (lines, {
  x = 72,
  y,
  size = 34,
  leading = size * 1.25,
  fill = palette.text,
  family = 's',
  weight = 500,
  anchor = 'start',
  tracking = 0,
} = {}) => lines.map((line, index) =>
  `<text class="${family}" x="${x}" y="${y + index * leading}" text-anchor="${anchor}" fill="${fill}" font-size="${size}" font-weight="${weight}" letter-spacing="${tracking}">${esc(line)}</text>`
).join('\n');

const divider = (y) => `<line x1="72" y1="${y}" x2="1008" y2="${y}" stroke="${palette.rule}" stroke-width="1.4"/>`;

const statPair = ({ y, label, earlier, later, note, accent = palette.nda }) => `
  <text class="s" x="72" y="${y}" fill="${palette.muted}" font-size="22" font-weight="700" letter-spacing="1.3">${esc(label.toUpperCase())}</text>
  <text class="r" x="72" y="${y + 78}" fill="${palette.upa}" font-size="58" font-weight="650">${esc(earlier)}</text>
  <text class="s" x="500" y="${y + 69}" fill="${palette.muted}" font-size="34" font-weight="500">→</text>
  <text class="r" x="560" y="${y + 78}" fill="${accent}" font-size="58" font-weight="650">${esc(later)}</text>
  <text class="s" x="72" y="${y + 121}" fill="${palette.muted}" font-size="19" font-weight="500">${esc(note)}</text>
`;

const verdictStrip = (lines, tone = 'neutral') => {
  const color = tone === 'upa' ? palette.upa : tone === 'nda' ? palette.nda : palette.oxblood;
  const soft = tone === 'upa' ? palette.upaSoft : tone === 'nda' ? palette.ndaSoft : '#eadfd7';
  return `
    <rect x="72" y="1042" width="936" height="112" rx="8" fill="${soft}"/>
    <rect x="72" y="1042" width="7" height="112" rx="3.5" fill="${color}"/>
    ${textLines(lines, { x: 100, y: 1080, size: 24, leading: 31, fill: palette.ink, weight: 650 })}
  `;
};

function chrome({ n, eyebrow, title, deck, source, body, verdict, art = false }) {
  const titleY = 225;
  const titleLeading = 70;
  const deckY = titleY + (title.length - 1) * titleLeading + 55;
  const contentTop = 400;
  const bars = Array.from({ length: 10 }, (_, index) => {
    const active = index + 1 <= n;
    const current = index + 1 === n;
    return `<rect x="${72 + index * 83}" y="112" width="66" height="${current ? 7 : 4}" rx="2" fill="${active ? (current ? palette.oxblood : '#91857a') : '#ded4c6'}"/>`;
  }).join('\n');
  const artLayer = art ? `
    <image href="data:image/png;base64,${artData}" x="0" y="610" width="1080" height="568" preserveAspectRatio="xMidYMid slice"/>
    <linearGradient id="art-fade-${n}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${palette.paper}" stop-opacity="1"/>
      <stop offset="0.30" stop-color="${palette.paper}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${palette.paper}" stop-opacity="0"/>
    </linearGradient>
    <rect x="0" y="606" width="1080" height="340" fill="url(#art-fade-${n})"/>
  ` : '';

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">
  <title>${esc(title.join(' '))}</title>
  <defs>
    <linearGradient id="paper-${n}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.paperLight}"/>
      <stop offset="1" stop-color="${palette.paper}"/>
    </linearGradient>
    <pattern id="fibre-${n}" width="42" height="42" patternUnits="userSpaceOnUse">
      <path d="M3 9h15 M28 31h8 M8 37h6 M31 7h4" stroke="#312920" stroke-opacity="0.025" stroke-width="1"/>
      <circle cx="22" cy="20" r="0.8" fill="#312920" fill-opacity="0.035"/>
    </pattern>
    <style>
      .r{font-family:'Newsreader',Georgia,serif}
      .s{font-family:'Inter','Segoe UI',sans-serif}
    </style>
  </defs>
  <rect width="1080" height="1350" fill="url(#paper-${n})"/>
  <rect width="1080" height="1350" fill="url(#fibre-${n})"/>
  ${artLayer}
  <rect x="28" y="28" width="1024" height="1294" fill="none" stroke="${palette.rule}" stroke-width="1.2"/>
  <rect x="35" y="35" width="1010" height="1280" fill="none" stroke="#ded1c1" stroke-width="0.8"/>

  <text class="s" x="72" y="76" fill="${palette.ink}" font-size="18" font-weight="700" letter-spacing="1.6">LOVEPREET SINGH</text>
  <text class="s" x="1008" y="76" text-anchor="end" fill="${palette.muted}" font-size="16" font-weight="600" letter-spacing="1.3">INDIA REPORT CARD · ${String(n).padStart(2, '0')} / 10</text>
  ${bars}

  <text class="s" x="72" y="158" fill="${palette.oxblood}" font-size="18" font-weight="750" letter-spacing="2.2">${esc(eyebrow.toUpperCase())}</text>
  ${textLines(title, { x: 72, y: titleY, size: 60, leading: titleLeading, fill: palette.ink, family: 'r', weight: 650, tracking: -0.8 })}
  ${textLines(deck, { x: 72, y: deckY, size: 25, leading: 34, fill: palette.muted, weight: 500 })}
  <g transform="translate(0, ${contentTop})">${body}</g>
  ${verdict ? verdictStrip(verdict.lines, verdict.tone) : ''}

  ${divider(1192)}
  ${textLines(source, { x: 72, y: 1227, size: 17, leading: 24, fill: palette.muted, weight: 500 })}
  <text class="s" x="72" y="1294" fill="${palette.ink}" font-size="18" font-weight="700" letter-spacing="1.2">MISTERLOVE.IN</text>
  <text class="s" x="1008" y="1294" text-anchor="end" fill="${palette.oxblood}" font-size="17" font-weight="750" letter-spacing="1.4">SAVE · SHARE · READ THE FULL REPORT</text>
</svg>`;
}

const slides = [
  {
    name: '01-cover.png',
    svg: chrome({
      n: 1,
      eyebrow: 'UPA vs NDA · the evidence',
      title: ['INDIA BEFORE 2014', 'VS AFTER 2014'],
      deck: ['Ten slides. The strongest numbers. The limits left visible.'],
      art: true,
      body: `
        <g transform="translate(72, 610)">
          <rect x="-14" y="-18" width="270" height="92" rx="5" fill="${palette.paperLight}" fill-opacity="0.88"/>
          <rect x="0" y="0" width="7" height="62" fill="${palette.upa}"/>
          <text class="s" x="22" y="24" fill="${palette.upa}" font-size="18" font-weight="750" letter-spacing="1.2">CONGRESS-LED UPA</text>
          <text class="r" x="22" y="57" fill="${palette.ink}" font-size="27" font-weight="600">2004–2014</text>
        </g>
        <g transform="translate(365, 610)">
          <rect x="-14" y="-18" width="270" height="92" rx="5" fill="${palette.paperLight}" fill-opacity="0.88"/>
          <rect x="0" y="0" width="7" height="62" fill="${palette.nda}"/>
          <text class="s" x="22" y="24" fill="${palette.nda}" font-size="18" font-weight="750" letter-spacing="1.2">BJP-LED NDA</text>
          <text class="r" x="22" y="57" fill="${palette.ink}" font-size="27" font-weight="600">2014–PRESENT</text>
        </g>
      `,
      source: ['Based on the seven-part report; evidence checked through 2–3 October 2026.', 'Each figure keeps its own observation date.'],
    }),
  },
  {
    name: '02-how-to-read.png',
    svg: chrome({
      n: 2,
      eyebrow: 'Before the numbers',
      title: ['THREE RULES', 'FOR A FAIR COMPARISON'],
      deck: ['The date, definition and shock belong beside every number.'],
      body: `
        <g transform="translate(72, 10)">
          <circle cx="42" cy="42" r="42" fill="${palette.upaSoft}"/><text class="r" x="42" y="57" text-anchor="middle" fill="${palette.upa}" font-size="45" font-weight="650">1</text>
          ${textLines(['Compare like with like.'], { x: 112, y: 34, size: 32, fill: palette.ink, family: 'r', weight: 650 })}
          ${textLines(['Same measure. Same unit. Dates shown.'], { x: 112, y: 70, size: 22, fill: palette.muted })}
        </g>
        <g transform="translate(72, 190)">
          <circle cx="42" cy="42" r="42" fill="${palette.ndaSoft}"/><text class="r" x="42" y="57" text-anchor="middle" fill="${palette.nda}" font-size="45" font-weight="650">2</text>
          ${textLines(['Change is not proof of cause.'], { x: 112, y: 34, size: 32, fill: palette.ink, family: 'r', weight: 650 })}
          ${textLines(['Governments inherit systems, projects and world conditions.'], { x: 112, y: 70, size: 22, fill: palette.muted })}
        </g>
        <g transform="translate(72, 370)">
          <circle cx="42" cy="42" r="42" fill="#eadfd7"/><text class="r" x="42" y="57" text-anchor="middle" fill="${palette.oxblood}" font-size="45" font-weight="650">3</text>
          ${textLines(['Count COVID honestly.'], { x: 112, y: 34, size: 32, fill: palette.ink, family: 'r', weight: 650 })}
          ${textLines(['It was an outside shock. The response was government policy.'], { x: 112, y: 70, size: 22, fill: palette.muted })}
        </g>
      `,
      verdict: {
        lines: ['Main comparison: UPA 2004–2014 vs NDA from 2014.', 'No single number can settle the whole record.'],
        tone: 'neutral',
      },
      source: ['Method: Part 7, pages 3–4. Full definitions and caveats appear in Parts 1–6.'],
    }),
  },
  {
    name: '03-growth.png',
    svg: chrome({
      n: 3,
      eyebrow: 'Economy',
      title: ['THE CLEANEST', 'TEN-YEAR GROWTH TEST'],
      deck: ['Observed real GDP growth, using one historical series.'],
      body: `
        <g transform="translate(72, 10)">
          <rect width="442" height="300" rx="10" fill="${palette.upaSoft}"/>
          <text class="s" x="34" y="50" fill="${palette.upa}" font-size="20" font-weight="750" letter-spacing="1.4">UPA · 2004-05 TO 2013-14</text>
          <text class="r" x="34" y="175" fill="${palette.ink}" font-size="98" font-weight="650">6.80%</text>
          <text class="s" x="34" y="220" fill="${palette.text}" font-size="24" font-weight="600">compound annual growth</text>
          <text class="s" x="34" y="264" fill="${palette.muted}" font-size="19">GDP rose about 93.0% across the decade.</text>
        </g>
        <g transform="translate(566, 10)">
          <rect width="442" height="300" rx="10" fill="${palette.ndaSoft}"/>
          <text class="s" x="34" y="50" fill="${palette.nda}" font-size="20" font-weight="750" letter-spacing="1.4">NDA · 2014-15 TO 2023-24</text>
          <text class="r" x="34" y="175" fill="${palette.ink}" font-size="98" font-weight="650">6.06%</text>
          <text class="s" x="34" y="220" fill="${palette.text}" font-size="24" font-weight="600">compound annual growth</text>
          <text class="s" x="34" y="264" fill="${palette.muted}" font-size="19">GDP rose about 80.1% across the decade.</text>
        </g>
        ${divider(365)}
        ${textLines(['Real income per person was much closer:'], { x: 72, y: 425, size: 26, fill: palette.ink, family: 'r', weight: 600 })}
        <text class="r" x="72" y="515" fill="${palette.upa}" font-size="65" font-weight="650">4.78%</text>
        <text class="s" x="276" y="505" fill="${palette.muted}" font-size="24">UPA</text>
        <text class="r" x="566" y="515" fill="${palette.nda}" font-size="65" font-weight="650">4.72%</text>
        <text class="s" x="770" y="505" fill="${palette.muted}" font-size="24">NDA</text>
      `,
      verdict: {
        lines: ['Observed equal-decade GDP growth: UPA leads.', 'COVID substantially qualifies the NDA result.'],
        tone: 'upa',
      },
      source: ['Source: NSO / Economic Survey 2025–26, Tables 1.7 and 1.1.', 'Author calculations from constant-price GDP and income levels.'],
    }),
  },
  {
    name: '04-infrastructure.png',
    svg: chrome({
      n: 4,
      eyebrow: 'Transport and power',
      title: ['NDA’S STRONGEST', 'DELIVERY CASE'],
      deck: ['Three large network expansions, with inherited work acknowledged.'],
      body: `
        ${statPair({ y: 18, label: 'National highways', earlier: '91,287 km', later: '1,46,572 km', note: 'March 2014 → February 2026' })}
        ${divider(188)}
        ${statPair({ y: 232, label: 'Rail electrification', earlier: '21,801 km', later: '69,873 km', note: '2014 → March 2026 · retrospective route-km series' })}
        ${divider(402)}
        ${statPair({ y: 446, label: 'Operating metro network', earlier: '248 km', later: '1,155 km', note: '2014 → March 2026' })}
      `,
      verdict: {
        lines: ['Verdict: NDA leads on transport-network expansion.', 'Stock growth can include redesignation; it is not all brand-new road.'],
        tone: 'nda',
      },
      source: ['Sources: Ministry of Road Transport & Highways; Ministry of Railways / PIB;', 'PIB infrastructure review. Exact dates shown above.'],
    }),
  },
  {
    name: '05-basic-services.png',
    svg: chrome({
      n: 5,
      eyebrow: 'Everyday public services',
      title: ['MORE CONNECTIONS', 'REACHED MORE HOMES'],
      deck: ['Reach improved sharply. Reliable, affordable service is the next test.'],
      body: `
        <text class="s" x="72" y="55" fill="${palette.muted}" font-size="21" font-weight="750" letter-spacing="1.3">RURAL TAP-WATER COVERAGE</text>
        <text class="r" x="72" y="180" fill="${palette.upa}" font-size="88" font-weight="650">16.72%</text>
        <text class="s" x="398" y="165" fill="${palette.muted}" font-size="38">→</text>
        <text class="r" x="490" y="180" fill="${palette.nda}" font-size="88" font-weight="650">82.24%</text>
        <text class="s" x="72" y="222" fill="${palette.muted}" font-size="20">August 2019 → August 2026 · not a 2014 baseline</text>
        ${divider(285)}
        <text class="s" x="72" y="347" fill="${palette.muted}" font-size="21" font-weight="750" letter-spacing="1.3">HOUSEHOLDS USING IMPROVED SANITATION</text>
        <text class="r" x="72" y="472" fill="${palette.upa}" font-size="88" font-weight="650">48.5%</text>
        <text class="s" x="398" y="457" fill="${palette.muted}" font-size="38">→</text>
        <text class="r" x="490" y="472" fill="${palette.nda}" font-size="88" font-weight="650">70.2%</text>
        <text class="s" x="72" y="514" fill="${palette.muted}" font-size="20">NFHS 2015–16 → NFHS 2019–21</text>
        ${textLines(['A tap is not proof of safe water every day.', 'A toilet count is not the same as sustained use and safe waste handling.'], { x: 72, y: 565, size: 23, leading: 34, fill: palette.text, weight: 550 })}
      `,
      verdict: {
        lines: ['Verdict: strong NDA case on wider basic-service reach.', 'Confidence is lower on uniform quality and affordability.'],
        tone: 'nda',
      },
      source: ['Sources: Jal Jeevan Mission, Seven Years of Progress (Aug 2026);', 'NFHS-4 and NFHS-5 India reports.'],
    }),
  },
  {
    name: '06-banking-digital.png',
    svg: chrome({
      n: 6,
      eyebrow: 'Banking and digital life',
      title: ['FOUNDATIONS FIRST.', 'SCALE AFTER.'],
      deck: ['This story crosses the 2014 handover.'],
      body: `
        <text class="s" x="72" y="48" fill="${palette.muted}" font-size="21" font-weight="750" letter-spacing="1.3">ADULTS WITH A FINANCIAL ACCOUNT</text>
        <text class="r" x="72" y="180" fill="${palette.upa}" font-size="96" font-weight="650">53.1%</text>
        <text class="s" x="390" y="165" fill="${palette.muted}" font-size="38">→</text>
        <text class="r" x="482" y="180" fill="${palette.nda}" font-size="96" font-weight="650">89.0%</text>
        <text class="s" x="72" y="224" fill="${palette.muted}" font-size="20">World Bank Findex · 2014 → 2024 · +35.9 percentage points</text>
        ${divider(294)}
        <line x1="116" y1="386" x2="922" y2="386" stroke="${palette.rule}" stroke-width="4"/>
        <circle cx="140" cy="386" r="14" fill="${palette.upa}"/><circle cx="350" cy="386" r="14" fill="${palette.upa}"/>
        <circle cx="620" cy="386" r="14" fill="${palette.nda}"/><circle cx="890" cy="386" r="14" fill="${palette.nda}"/>
        ${textLines(['2008', 'NPCI'], { x: 140, y: 345, size: 21, leading: 78, fill: palette.upa, weight: 700, anchor: 'middle' })}
        ${textLines(['2009–10', 'UIDAI / Aadhaar'], { x: 350, y: 345, size: 21, leading: 78, fill: palette.upa, weight: 700, anchor: 'middle' })}
        ${textLines(['2014', 'Jan Dhan'], { x: 620, y: 345, size: 21, leading: 78, fill: palette.nda, weight: 700, anchor: 'middle' })}
        ${textLines(['2016', 'UPI pilot'], { x: 890, y: 345, size: 21, leading: 78, fill: palette.nda, weight: 700, anchor: 'middle' })}
        ${textLines(['UPA built important identity and payment foundations.', 'NDA drove later account-opening and payment scale.'], { x: 72, y: 560, size: 26, leading: 38, fill: palette.text, family: 'r', weight: 600 })}
      `,
      verdict: {
        lines: ['Verdict: shared foundations; NDA leads on later scale.', 'Access still differs from regular use, control and fraud-free service.'],
        tone: 'nda',
      },
      source: ['Sources: UIDAI and NPCI chronology; World Bank Global Findex 2025 database.', 'The 2014 survey is a handover-year observation.'],
    }),
  },
  {
    name: '07-poverty.png',
    svg: chrome({
      n: 7,
      eyebrow: 'Poverty and food security',
      title: ['POVERTY FELL', 'IN BOTH PERIODS'],
      deck: ['The poverty line and observation years decide what can be compared.'],
      body: `
        ${statPair({ y: 12, label: 'Tendulkar monetary poverty', earlier: '37.2%', later: '21.9%', note: '2004-05 → 2011-12 · substantial UPA-era fall', accent: palette.upa })}
        ${divider(180)}
        ${statPair({ y: 224, label: 'World Bank $3/day · 2021 PPP', earlier: '27.1%', later: '2.6%', note: '2011-12 → 2023-24 · period overlaps both eras' })}
        ${divider(392)}
        ${statPair({ y: 436, label: 'Multidimensional poverty', earlier: '24.85%', later: '14.96%', note: '2015-16 → 2019-21 · NITI / NFHS-based comparison' })}
      `,
      verdict: {
        lines: ['Verdict: strong gains in both eras.', 'No clean poverty-rate winner from precisely the 2014 handover.'],
        tone: 'neutral',
      },
      source: ['Sources: Finance Ministry poverty estimates; World Bank India Development', 'Update (Apr 2026); NITI Aayog MPI Progress Review (2023).'],
    }),
  },
  {
    name: '08-banks-public-money.png',
    svg: chrome({
      n: 8,
      eyebrow: 'Banks and public money',
      title: ['LATER STABILITY:', 'A STRONGER NDA CASE'],
      deck: ['The clearest evidence is bank health; the caveats still matter.'],
      body: `
        <g transform="translate(72, 12)">
          <rect width="936" height="230" rx="10" fill="${palette.ndaSoft}"/>
          <text class="s" x="34" y="52" fill="${palette.nda}" font-size="21" font-weight="750" letter-spacing="1.2">GROSS BAD-LOAN RATIO</text>
          <text class="r" x="34" y="150" fill="${palette.upa}" font-size="72" font-weight="650">4.1%</text>
          <text class="s" x="260" y="140" fill="${palette.muted}" font-size="36">→</text>
          <text class="r" x="350" y="150" fill="${palette.nda}" font-size="72" font-weight="650">1.8%</text>
          <text class="s" x="34" y="202" fill="${palette.text}" font-size="20">March 2014 → March 2026 · scheduled commercial banks</text>
        </g>
        <g transform="translate(72, 272)">
          <rect width="936" height="230" rx="10" fill="#eee7dc"/>
          <text class="s" x="34" y="52" fill="${palette.oxblood}" font-size="21" font-weight="750" letter-spacing="1.2">CENTRAL CAPITAL EXPENDITURE · NOMINAL</text>
          <text class="r" x="34" y="145" fill="${palette.upa}" font-size="52" font-weight="650">₹1.88 lakh cr</text>
          <text class="s" x="440" y="136" fill="${palette.muted}" font-size="32">→</text>
          <text class="r" x="505" y="145" fill="${palette.nda}" font-size="52" font-weight="650">₹10.69 lakh cr</text>
          <text class="s" x="34" y="200" fill="${palette.text}" font-size="20">FY2013-14 → FY2025-26 provisional accounts</text>
        </g>
        ${textLines(['Bad loans first rose as RBI forced recognition of stressed assets.', 'Recovery, restructuring, write-offs and loan growth all affect the ratio.'], { x: 72, y: 550, size: 22, leading: 32, fill: palette.text })}
      `,
      verdict: {
        lines: ['Verdict: NDA has the stronger bank-cleanup case.', 'The capex comparison is nominal; higher rupees do not equal equal value.'],
        tone: 'nda',
      },
      source: ['Sources: RBI Financial Stability Report (Jun 2026);', 'Controller General of Accounts, FY2025–26 provisional accounts.'],
    }),
  },
  {
    name: '09-rights.png',
    svg: chrome({
      n: 9,
      eyebrow: 'Rights and accountability',
      title: ['HERE, UPA HAS', 'THE STRONGER CASE'],
      deck: ['Independent assessments moved in the opposite direction to delivery.'],
      body: `
        <g transform="translate(72, 12)">
          <text class="s" x="0" y="36" fill="${palette.muted}" font-size="21" font-weight="750" letter-spacing="1.3">FREEDOM HOUSE</text>
          <rect x="0" y="60" width="442" height="200" rx="10" fill="${palette.upaSoft}"/>
          <text class="r" x="30" y="135" fill="${palette.upa}" font-size="52" font-weight="650">FREE</text>
          <text class="s" x="30" y="182" fill="${palette.text}" font-size="23" font-weight="650">2013 edition</text>
          <rect x="494" y="60" width="442" height="200" rx="10" fill="${palette.ndaSoft}"/>
          <text class="r" x="524" y="128" fill="${palette.nda}" font-size="43" font-weight="650">PARTLY FREE</text>
          <text class="s" x="524" y="178" fill="${palette.text}" font-size="23" font-weight="650">62 / 100 · 2026</text>
          <text class="s" x="524" y="218" fill="${palette.muted}" font-size="17">Publisher’s framework, not an Indian rating.</text>
        </g>
        ${divider(300)}
        <text class="s" x="72" y="350" fill="${palette.muted}" font-size="21" font-weight="750" letter-spacing="1.3">REPORTERS WITHOUT BORDERS · PRESS FREEDOM RANK</text>
        <text class="r" x="72" y="450" fill="${palette.upa}" font-size="72" font-weight="650">140 / 179</text>
        <text class="s" x="450" y="438" fill="${palette.muted}" font-size="36">→</text>
        <text class="r" x="540" y="450" fill="${palette.nda}" font-size="72" font-weight="650">157 / 180</text>
        <text class="s" x="72" y="495" fill="${palette.muted}" font-size="19">2013 → 2026 · methodology changed in 2022; do not splice scores</text>
        ${textLines(['These indexes use expert judgments and debatable methods.', 'Their concerns still cannot be answered by infrastructure gains.'], { x: 72, y: 555, size: 22, leading: 32, fill: palette.text })}
      `,
      verdict: {
        lines: ['Verdict on the evidence examined: UPA stronger.', 'India’s earlier institutional record also had serious shortcomings.'],
        tone: 'upa',
      },
      source: ['Sources: Freedom House, Freedom in the World 2013 and 2026;', 'Reporters Without Borders, World Press Freedom Index 2013 and 2026.'],
    }),
  },
  {
    name: '10-verdict.png',
    svg: chrome({
      n: 10,
      eyebrow: 'The final answer',
      title: ['A QUALIFIED', 'NDA LEAD'],
      deck: ['The result depends on what you give the greatest weight.'],
      body: `
        <g transform="translate(72, 5)">
          <rect width="936" height="210" rx="10" fill="${palette.ndaSoft}"/>
          <rect width="8" height="210" rx="4" fill="${palette.nda}"/>
          <text class="s" x="40" y="52" fill="${palette.nda}" font-size="20" font-weight="750" letter-spacing="1.3">WHY NDA LEADS IN THIS REPORT</text>
          ${textLines(['More weight is given to public networks,', 'basic-service reach and financial access.', 'Bank cleanup and later delivery add to the case.'], { x: 40, y: 102, size: 29, leading: 38, fill: palette.ink, family: 'r', weight: 600 })}
        </g>
        <g transform="translate(72, 242)">
          <rect width="936" height="210" rx="10" fill="${palette.upaSoft}"/>
          <rect width="8" height="210" rx="4" fill="${palette.upa}"/>
          <text class="s" x="40" y="52" fill="${palette.upa}" font-size="20" font-weight="750" letter-spacing="1.3">THE STRONGEST CASE AGAINST THAT VERDICT</text>
          ${textLines(['UPA leads observed equal-decade GDP growth.', 'Per-person income growth is almost tied.', 'Independent freedom assessments favour UPA.'], { x: 40, y: 102, size: 29, leading: 38, fill: palette.ink, family: 'r', weight: 600 })}
        </g>
        <text class="r" x="72" y="510" fill="${palette.ink}" font-size="33" font-weight="650">Growth-and-rights first? You may choose UPA.</text>
        <text class="r" x="72" y="555" fill="${palette.ink}" font-size="33" font-weight="650">Delivery-and-reach first? NDA has the stronger answer.</text>
      `,
      verdict: {
        lines: ['Final verdict: qualified NDA lead for material delivery.', 'It is not a claim that every outcome improved after 2014.'],
        tone: 'nda',
      },
      source: ['Author’s judgment after Parts 1–6; Part 7 contains 59 references.', 'Read the full report: misterlove.in/writing/india-before-and-after-2014/'],
    }),
  },
];

mkdirSync(OUT, { recursive: true });
const manifest = [];

for (const slide of slides) {
  const renderer = new Resvg(slide.svg, {
    fitTo: { mode: 'width', value: W },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Inter' },
  });
  const image = renderer.render();
  const png = image.asPng();
  if (image.width !== W || image.height !== H) {
    throw new Error(`${slide.name} rendered at ${image.width}×${image.height}`);
  }
  if (png.length < 45_000) {
    throw new Error(`${slide.name} is unexpectedly small (${png.length} bytes)`);
  }
  const file = resolve(OUT, slide.name);
  writeFileSync(file, png);
  manifest.push({
    file: slide.name,
    width: image.width,
    height: image.height,
    bytes: png.length,
    sha256: createHash('sha256').update(png).digest('hex'),
  });
  console.log(`${slide.name.padEnd(30)} ${image.width}x${image.height}  ${(png.length / 1024).toFixed(0)} KB`);
}

writeFileSync(
  resolve(OUT, 'manifest.json'),
  `${JSON.stringify({
    generatedBy: 'npm run social:india',
    evidenceCheckedThrough: '2026-10-03',
    slides: manifest,
  }, null, 2)}\n`,
  'utf8',
);
console.log(`\n✓ ${manifest.length} connected Instagram slides → ${OUT}`);
