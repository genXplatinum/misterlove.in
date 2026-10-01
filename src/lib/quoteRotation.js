import { godQuotes } from '../data/godQuotes.js';

export const QUOTE_STORAGE_KEY = 'misterlove:god-quote-history';

export function readQuoteHistory(storage) {
  try {
    const value = JSON.parse(storage.getItem(QUOTE_STORAGE_KEY));
    return Array.isArray(value) ? value.filter(id => godQuotes.some(q => q.id === id)).slice(-godQuotes.length) : [];
  } catch { return []; }
}

export function nextQuote(history, random = Math.random) {
  const last = godQuotes.find(q => q.id === history.at(-1));
  // Alternate affirmation and challenge while exploring the whole collection.
  const opposing = godQuotes.filter(q => !last || q.side !== last.side);
  const unseen = opposing.filter(q => !history.includes(q.id));
  const pool = unseen.length ? unseen : opposing;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

export function rememberQuote(quote, history, storage) {
  const next = [...history.filter(id => id !== quote.id), quote.id].slice(-godQuotes.length);
  try { storage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(next)); } catch { /* In-memory rotation still works. */ }
  return next;
}
