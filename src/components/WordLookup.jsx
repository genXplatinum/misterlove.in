import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './WordLookup.css';

/*
 * WordLookup — triple-click any word in the reading prose to open a small
 * dictionary card: pronunciation (with audio), part of speech, definitions and
 * examples. Data comes from the Free Dictionary API (dictionaryapi.dev): free,
 * no key, and CORS-friendly, so it works from a static host with no backend.
 * A link out to the full Cambridge / Wiktionary entry sits in the footer.
 */

const API = 'https://api.dictionaryapi.dev/api/v2/entries';

// A "word" is letters (any script), combining marks, apostrophes and hyphens.
const WORD_CHAR = /[\p{L}\p{M}'’-]/u;

function wordInfoAtPoint(x, y) {
  let range = null;
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  } else if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y);
    if (pos) {
      range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
    }
  }

  const node = range?.startContainer;
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;

  const text = node.textContent;
  let start = range.startOffset;
  let end = range.startOffset;
  while (start > 0 && WORD_CHAR.test(text[start - 1])) start -= 1;
  while (end < text.length && WORD_CHAR.test(text[end])) end += 1;
  if (end <= start) return null;

  const word = text.slice(start, end).replace(/^['’-]+|['’-]+$/g, '');
  if (!word) return null;

  const wordRange = document.createRange();
  wordRange.setStart(node, start);
  wordRange.setEnd(node, end);
  const rect = (wordRange.getClientRects()[0] || wordRange.getBoundingClientRect());

  const langEl = node.parentElement?.closest('[lang]');
  const lang = (langEl?.getAttribute('lang') || document.documentElement.lang || 'en')
    .slice(0, 2)
    .toLowerCase();

  return {
    word,
    lang,
    rect: { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width },
  };
}

function normalise(entries) {
  const phonetics = entries.flatMap((entry) => entry.phonetics || []);
  const phonetic = entries.find((entry) => entry.phonetic)?.phonetic
    || phonetics.find((p) => p.text)?.text
    || '';
  const audioRaw = phonetics.find((p) => p.audio)?.audio || '';
  const audio = audioRaw.startsWith('//') ? `https:${audioRaw}` : audioRaw;

  const meanings = entries
    .flatMap((entry) => entry.meanings || [])
    .map((meaning) => ({
      pos: meaning.partOfSpeech,
      defs: (meaning.definitions || []).slice(0, 2).map((d) => ({
        def: d.definition,
        example: d.example,
      })),
      synonyms: (meaning.synonyms || []).slice(0, 6),
    }))
    .filter((meaning) => meaning.defs.length)
    .slice(0, 4);

  return { word: entries[0]?.word, phonetic, audio, meanings };
}

function externalEntry(word, lang) {
  const term = encodeURIComponent(word);
  return lang === 'en'
    ? { label: 'Cambridge ↗', href: `https://dictionary.cambridge.org/dictionary/english/${term}` }
    : { label: 'Wiktionary ↗', href: `https://${lang}.wiktionary.org/wiki/${term}` };
}

export default function WordLookup({ scope = '.prose' }) {
  const [entry, setEntry] = useState(null); // { status, word, lang, rect, data }
  const [pos, setPos] = useState(null);
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const audioRef = useRef(null);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    try { window.speechSynthesis?.cancel(); } catch { /* speech unsupported */ }
  }, []);

  const close = useCallback(() => {
    stopPlayback();
    setEntry(null);
    setPos(null);
    const target = restoreFocusRef.current;
    restoreFocusRef.current = null;
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
  }, [stopPlayback]);

  const lookup = useCallback(async (word, lang, rect) => {
    const term = word.toLowerCase();
    setEntry({ status: 'loading', word, lang, rect });
    try {
      const res = await fetch(`${API}/${lang}/${encodeURIComponent(term)}`);
      if (!res.ok) {
        setEntry({ status: 'empty', word, lang, rect });
        return;
      }
      const json = await res.json();
      setEntry({ status: 'ready', word, lang, rect, data: normalise(json) });
    } catch {
      setEntry({ status: 'error', word, lang, rect });
    }
  }, []);

  // Triple-click within the reading prose opens the card.
  useEffect(() => {
    const onClick = (event) => {
      if (event.detail !== 3 || event.button !== 0) return;
      if (!event.target.closest?.(scope)) return;
      const info = wordInfoAtPoint(event.clientX, event.clientY);
      if (!info) return;
      window.getSelection()?.removeAllRanges(); // drop the triple-click paragraph highlight
      restoreFocusRef.current = document.activeElement;
      lookup(info.word, info.lang, info.rect);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [scope, lookup]);

  // Dismiss on Escape, outside pointer, scroll or resize; move focus into the card.
  useEffect(() => {
    if (!entry) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') close(); };
    const onPointer = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('scroll', close, { passive: true, capture: true });
    window.addEventListener('resize', close);
    const focus = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('scroll', close, { capture: true });
      window.removeEventListener('resize', close);
      cancelAnimationFrame(focus);
    };
  }, [entry, close]);

  // Place the card next to the word, flipping above when there isn't room below.
  useLayoutEffect(() => {
    if (!entry || !panelRef.current) return;
    const panel = panelRef.current.getBoundingClientRect();
    const margin = 12;
    const gap = 8;
    const { rect } = entry;
    const left = Math.max(margin, Math.min(rect.left, window.innerWidth - panel.width - margin));
    const roomBelow = window.innerHeight - rect.bottom - gap - margin;
    const placeAbove = roomBelow < panel.height && rect.top - panel.height - gap > margin;
    const top = placeAbove
      ? rect.top - panel.height - gap
      : Math.min(rect.bottom + gap, window.innerHeight - panel.height - margin);
    setPos({ top: Math.max(margin, top), left });
  }, [entry]);

  if (!entry) return null;

  // Speak the word with the browser's built-in voice — the reliable fallback,
  // since the free API's recorded clips are frequently missing (404).
  const speak = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    try {
      const utter = new SpeechSynthesisUtterance(entry.data?.word || entry.word);
      utter.lang = entry.lang === 'en' ? 'en-GB' : entry.lang;
      utter.rate = 0.95;
      synth.speak(utter);
    } catch { /* speech unsupported */ }
  };

  const play = () => {
    if (entry.status !== 'ready') return;
    stopPlayback();
    const src = entry.data.audio;
    if (!src) { speak(); return; }
    try {
      const audio = new Audio(src);
      audioRef.current = audio;
      let fellBack = false;
      const fallback = () => { if (fellBack) return; fellBack = true; audioRef.current = null; speak(); };
      audio.addEventListener('error', fallback, { once: true });
      const started = audio.play();
      if (started && typeof started.catch === 'function') started.catch(fallback);
    } catch { speak(); }
  };

  const out = externalEntry(entry.word, entry.lang);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const canPronounce = entry.status === 'ready' && (Boolean(entry.data.audio) || canSpeak);

  return createPortal(
    <div
      ref={panelRef}
      className="wl-card"
      role="dialog"
      aria-label={`Dictionary: ${entry.word}`}
      tabIndex={-1}
      style={{
        top: pos ? `${pos.top}px` : '-9999px',
        left: pos ? `${pos.left}px` : '-9999px',
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
      <button type="button" className="wl-card__close" onClick={close} aria-label="Close dictionary">
        <span aria-hidden="true">✕</span>
      </button>

      <div className="wl-card__head">
        <span className="wl-card__word" lang={entry.lang}>{entry.data?.word || entry.word}</span>
        {entry.status === 'ready' && entry.data.phonetic && (
          <span className="wl-card__phon">{entry.data.phonetic}</span>
        )}
        {canPronounce && (
          <button
            type="button"
            className="wl-card__say"
            onClick={play}
            aria-label={`Play pronunciation of ${entry.word}`}
          >
            <span aria-hidden="true">▶</span>
          </button>
        )}
      </div>

      <div className="wl-card__body">
        {entry.status === 'loading' && (
          <p className="wl-card__note mono" role="status">Looking up “{entry.word}”…</p>
        )}
        {entry.status === 'empty' && (
          <p className="wl-card__note" role="status">No dictionary entry for “{entry.word}”.</p>
        )}
        {entry.status === 'error' && (
          <p className="wl-card__note" role="status">Couldn’t reach the dictionary just now.</p>
        )}
        {entry.status === 'ready' && entry.data.meanings.map((meaning, i) => (
          <div className="wl-sense" key={`${meaning.pos}-${i}`}>
            <span className="wl-sense__pos mono">{meaning.pos}</span>
            <ol className="wl-sense__defs">
              {meaning.defs.map((d, j) => (
                <li key={j}>
                  <span className="wl-sense__def">{d.def}</span>
                  {d.example && <span className="wl-sense__eg">“{d.example}”</span>}
                </li>
              ))}
            </ol>
            {meaning.synonyms.length > 0 && (
              <p className="wl-sense__syn">
                <span className="mono">syn</span> {meaning.synonyms.join(', ')}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="wl-card__foot">
        <span className="mono">Free Dictionary</span>
        <a href={out.href} target="_blank" rel="noopener noreferrer" className="wl-card__link">
          {out.label}
        </a>
      </div>
    </div>,
    document.body,
  );
}
