import assert from 'node:assert/strict';
import { godQuotes } from '../src/data/godQuotes.js';
import { nextQuote, rememberQuote, readQuoteHistory, QUOTE_STORAGE_KEY } from '../src/lib/quoteRotation.js';

const values = new Map();
const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
assert.deepEqual(readQuoteHistory(storage), []);
storage.setItem(QUOTE_STORAGE_KEY, '{broken');
assert.deepEqual(readQuoteHistory(storage), []);
storage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(['removed-quote', godQuotes[0].id]));
assert.deepEqual(readQuoteHistory(storage), [godQuotes[0].id]);

let history = [];
let previous;
const firstCycle = new Set();
for (let i = 0; i < 100; i++) {
  const quote = nextQuote(history, () => ((i * 37) % 100) / 100);
  assert.ok(quote.source.startsWith('https://'));
  if (previous) {
    assert.notEqual(quote.id, previous.id, 'A refresh must not repeat the previous quote');
    assert.notEqual(quote.side, previous.side, 'Affirmation and criticism should alternate');
  }
  if (i < godQuotes.length) firstCycle.add(quote.id);
  history = rememberQuote(quote, history, storage);
  assert.deepEqual(readQuoteHistory(storage), history, 'Reopening must recover the previous selection');
  previous = quote;
}
assert.equal(firstCycle.size, godQuotes.length, 'The first cycle should cover the full collection');
assert.deepEqual(readQuoteHistory(undefined), []);
assert.ok(rememberQuote(godQuotes[0], [], undefined).includes(godQuotes[0].id));
console.log('Quote rotation passed: balanced perspectives, no consecutive repeats, persistence, malformed/blocked storage.');
