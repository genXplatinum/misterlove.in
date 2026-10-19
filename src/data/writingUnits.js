/** Completed book volumes use the existing reader without calling them serial parts. */
export const unitNameOf = (piece, language = piece?.language ?? 'en') => (
  piece?.unit === 'volume' ? (language === 'hi' ? 'पुस्तक' : 'Volume') : (language === 'hi' ? 'भाग' : 'Part')
);

export function withVolumeCopy(piece, copy) {
  if (piece?.unit !== 'volume') return copy;
  const hi = piece.language === 'hi';
  return {
    ...copy,
    part: hi ? 'पुस्तक' : 'Volume',
    parts: hi ? 'पुस्तकें' : 'Volumes',
    start: hi ? 'पढ़ना शुरू करें — पुस्तक 01' : 'Start reading — Volume 01',
    contents: hi ? 'उपलब्ध पुस्तकें' : 'VOLUMES',
    contentsSummary: (p) => hi ? `${p.parts} पूरी पुस्तकें, हर एक में ${p.chaptersPerVolume} अध्याय` : `${p.parts} complete volumes, ${p.chaptersPerVolume} chapters each`,
    thisPart: hi ? 'यह पुस्तक' : 'This volume',
    inThisPart: hi ? 'इस पुस्तक के अध्याय' : 'Chapters in this volume',
    allParts: typeof copy.allParts === 'function' ? ((n) => hi ? `सभी ${n} पुस्तकें` : `All ${n} volumes`) : (hi ? 'सभी पुस्तकें' : 'All volumes'),
    loading: (n) => hi ? `पुस्तक ${n} खुल रही है…` : `Loading volume ${n}…`,
    loadFail: hi ? 'यह पुस्तक नहीं खुल पाई।' : 'This volume didn’t load.',
    begins: (n) => hi ? `पुस्तक ${n} शुरू होती है` : `Volume ${n} begins`,
    sources: typeof copy.sources === 'function' ? ((n) => hi ? `टिप्पणियाँ और स्रोत — पुस्तक ${n}` : `Notes and sources — Volume ${n}`) : (hi ? 'टिप्पणियाँ और स्रोत' : 'Notes and sources'),
    partsAria: hi ? 'श्रृंखला की पुस्तकें' : 'Series volumes',
    allPartsHead: hi ? 'सभी पुस्तकें' : 'ALL VOLUMES',
    endOfPart: (n) => hi ? `पुस्तक ${n} समाप्त` : `End of Volume ${n}`,
    readFull: hi ? 'पूरी पुस्तक पढ़ें' : 'Read the complete volume',
  };
}
