import './PublicationCover.css';

// A visual identity for each collection, shared by its articles. These are
// reading-interface illustrations, not reproductions of physical book covers.
const themes = {
  'atheist-vs-believer': { ground: '#27332d', ink: '#f1f0e5', motif: 'orbits', variation: 2 },
  'why-i-dont-believe': { ground: '#1e2823', ink: '#efefe6', motif: 'orbits', variation: 0 },
  'india-before-and-after-2014': { ground: '#cad1cc', ink: '#26392e', motif: 'columns', variation: 1 },
  confessions: { ground: '#686758', ink: '#f6f2e6', motif: 'orbits', variation: 3 },
  'wars-of-punjab': { ground: '#39463c', ink: '#f1f0e4', motif: 'folds', variation: 1 },
  'sapiens-reading': { ground: '#b9c4c9', ink: '#253b44', motif: 'branches', variation: 2 },
  'origin-of-species': { ground: '#d7d8ce', ink: '#252b22', motif: 'branches', variation: 0 },
  'architecture-of-money': { ground: '#526345', ink: '#f2f4e9', motif: 'frames', variation: 0 },
  'congress-record': { ground: '#d6d3c8', ink: '#363b32', motif: 'columns', variation: 2 },
  'rules-about-women': { ground: '#ebe9e4', ink: '#322f2c', motif: 'folds', variation: 0 },
  'punjab-history': { ground: '#8f9b83', ink: '#17251c', motif: 'rivers', variation: 0 },
  punjab: { ground: '#d0d6bd', ink: '#2d3923', motif: 'rivers', variation: 2 },
  'reservation-files': { ground: '#525c65', ink: '#f0f2ed', motif: 'columns', variation: 0 },
  'patriarchy-feminism': { ground: '#d1c9c7', ink: '#413637', motif: 'orbits', variation: 1 },
  independence: { ground: '#e1decb', ink: '#3b4430', motif: 'folds', variation: 2 },
  'kissan-andolan': { ground: '#626f47', ink: '#f8f7e9', motif: 'rivers', variation: 1 },
  'debunked-sikhism': { ground: '#374d4b', ink: '#edf1e6', motif: 'frames', variation: 2 },
  debunked: { ground: '#bbc5c7', ink: '#293e43', motif: 'frames', variation: 1 },
  'forgotten-gods': { ground: '#747366', ink: '#fffef1', motif: 'orbits', variation: 4 },
  'the-thing': { ground: '#e6e4da', ink: '#33352d', motif: 'folds', variation: 3 },
  epistles: { ground: '#485644', ink: '#f1f1e8', motif: 'frames', variation: 3 },
  sapiens: { ground: '#d7dce0', ink: '#2d3b44', motif: 'branches', variation: 1 },
};

const fallback = { ground: '#dfe3df', ink: '#293c35', motif: 'columns', variation: 3 };

export function coverThemeOf(piece) {
  return themes[typeof piece === 'string' ? piece : piece?.slug] ?? fallback;
}

function CoverMark({ motif, variation }) {
  const v = variation;
  return <svg className={`pc-mark pc-mark--${motif}`} viewBox="0 0 320 220" fill="none" aria-hidden="true" focusable="false">
    {motif === 'orbits' && <>
      {Array.from({ length: 10 }, (_, i) => <ellipse key={i} cx="160" cy="110" rx={33 + i * 10} ry={81 - i * 2.6} transform={`rotate(${i * (7 + v) + v * 16} 160 110)`} />)}
      <circle cx={160 + v * 3} cy="110" r="5" fill="currentColor" stroke="none" />
    </>}
    {motif === 'frames' && <>
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${32 + i * 11} 184V${28 + i * (5 + v)}H${200 + i * 10}V${184 - i * 5}Z`} />)}
      <path d={v % 2 ? 'M40 30 280 190M40 106V30h76' : 'M40 190 280 28M204 28h76v76'} />
    </>}
    {motif === 'branches' && <>
      <path d="M160 204V22" />
      {Array.from({ length: 7 }, (_, i) => {
        const y = 176 - i * 23;
        const spread = 22 + i * (14 + v);
        return <g key={i}><path d={`M160 ${y}L${160 - spread} ${y - 24 - v * 3}M160 ${y}L${160 + spread} ${y - 24 + v * 3}`} /><circle cx={160 - spread} cy={y - 24 - v * 3} r="3" /><circle cx={160 + spread} cy={y - 24 + v * 3} r="3" /></g>;
      })}
    </>}
    {motif === 'columns' && <>
      {Array.from({ length: 8 }, (_, i) => {
        const top = 34 + ((i + v) % 4) * 18;
        return <path key={i} d={`M${34 + i * 35} 190V${top}h20v${190 - top}M${34 + i * 35} ${top + 17}h20`} />;
      })}
      <path d={`M22 ${119 + v * 9}H298M22 201H298`} />
    </>}
    {motif === 'rivers' && <>
      {Array.from({ length: 5 }, (_, i) => <path key={i} d={`M${38 + i * 53} 18C${4 + i * 57 + v * 6} 75 ${120 + i * 28 - v * 9} 133 ${49 + i * 49} 202`} />)}
      {Array.from({ length: 6 }, (_, i) => <path key={i} opacity=".5" d={`M28 ${38 + i * 29}C110 ${24 + i * 29} 204 ${58 + i * 24} 290 ${36 + i * 29}`} />)}
    </>}
    {motif === 'folds' && <>
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M28 ${30 + i * 23}H${128 + v * 8}L${179 - v * 6} ${13 + i * 23}H292`} />)}
      <path d={`M${128 + v * 8} 30V191M${179 - v * 6} 13V174`} />
      <path d="m46 192 25-25m175-131 25-25" strokeWidth="2" />
    </>}
  </svg>;
}

/**
 * `title` overrides the collection title for an article/study cover.
 * Consumers with adjacent equivalent text can pass aria-hidden="true".
 * No heading level or link is imposed on the surrounding reading interface.
 */
export default function PublicationCover({ piece = {}, title, label, compact = false, className = '', ...attributes }) {
  const theme = coverThemeOf(piece);
  const coverTitle = String(title || piece.title || 'Independent inquiry');
  const article = Boolean(title && title !== piece.title);
  const coverLabel = label || (piece.author ? 'A close reading' : 'Research collection');
  const length = Array.from(coverTitle).length;
  const size = length > 135 ? 0.6 : length > 95 ? 0.7 : length > 65 ? 0.8 : length > 38 ? 0.9 : 1;
  const subtitle = article ? piece.title : piece.subtitle;
  return <div
    className={`pc-cover${compact ? ' pc-cover--compact' : ''}${length > 95 ? ' pc-cover--long' : ''} ${className}`.trim()}
    style={{ '--pc-ground': theme.ground, '--pc-ink': theme.ink, '--pc-title-scale': size }}
    role="img"
    aria-label={`${coverTitle}. ${coverLabel}. ${piece.author ? 'Reading by ' : ''}Lovepreet Singh.`}
    {...attributes}
  >
    <div className="pc-front">
      <div className="pc-top"><span>{coverLabel}</span><span className="pc-imprint">MisterLove</span></div>
      <div className="pc-copy">
        <span className="pc-title">{coverTitle}</span>
        {subtitle && !compact && <span className="pc-subtitle">{subtitle}</span>}
      </div>
      <CoverMark motif={theme.motif} variation={theme.variation} />
      <div className="pc-bottom"><span>{piece.author ? 'A reading by' : 'Research & writing'}<strong>Lovepreet Singh</strong></span><span className="pc-colophon" aria-hidden="true">m.</span></div>
    </div>
  </div>;
}
