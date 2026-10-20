// A bounded loading overlay must never trap a reader. Exercise its browser
// lifecycle with deterministic timers; visual appearance is checked in-browser.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const script = readFileSync(fileURLToPath(new URL('../public/brand/intro.js', import.meta.url)), 'utf8');

function browser({ ready = false, reduced = false, seen = false, storageBlocked = false, missingIntro = false } = {}) {
  let now = 0;
  let sequence = 0;
  const timers = new Map();
  const listeners = new Map();
  const classes = new Set();
  const storage = new Map(seen ? [['misterlove:intro-seen:v1', '1']] : []);
  const intro = { dataset: {} };
  const document = {
    readyState: ready ? 'complete' : 'loading',
    documentElement: { classList: { add: name => classes.add(name), remove: name => classes.delete(name) } },
    getElementById: id => id === 'brand-intro' && !missingIntro ? intro : null,
  };
  const window = {
    addEventListener(name, handler, options) {
      if (!listeners.has(name)) listeners.set(name, new Map());
      listeners.get(name).set(handler, options?.once ?? false);
    },
    removeEventListener(name, handler) { listeners.get(name)?.delete(handler); },
  };
  vm.runInNewContext(script, {
    document, window,
    performance: { now: () => now },
    matchMedia: () => ({ matches: reduced }),
    sessionStorage: {
      getItem(key) {
        if (storageBlocked) throw new Error('Storage disabled');
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        if (storageBlocked) throw new Error('Storage disabled');
        storage.set(key, value);
      },
    },
    setTimeout(callback, delay = 0) {
      const id = ++sequence;
      timers.set(id, { at: now + delay, callback });
      return id;
    },
    clearTimeout: id => timers.delete(id),
  }, { timeout: 1000, filename: 'intro.js' });
  return {
    intro, classes, timers, storage,
    advance(to) {
      assert.ok(to >= now, 'Test clock must move forward');
      while (true) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > to) break;
        now = next[1].at;
        timers.delete(next[0]);
        next[1].callback();
      }
      now = to;
    },
    fire(name, event = {}) {
      if (name === 'load') document.readyState = 'complete';
      for (const [handler, once] of listeners.get(name) ?? []) {
        if (once) listeners.get(name).delete(handler);
        handler(event);
      }
    },
    assertDismissed() {
      assert.equal(intro.dataset.state, 'dismissed');
      assert.ok(!classes.has('brand-intro-active'), 'Intro must release the page');
      assert.equal(timers.size, 0, 'Dismissal must clean up both timers');
      assert.equal([...listeners.values()].reduce((sum, handlers) => sum + handlers.size, 0), 0,
        'Dismissal must clean up browser listeners');
    },
  };
}

let cases = 0;
for (const options of [{ reduced: true }, { seen: true }, { missingIntro: true }]) {
  const page = browser(options);
  assert.ok(!page.classes.has('brand-intro-active'), 'Skipped intro must not cover the page');
  assert.equal(page.timers.size, 0);
  cases++;
}
const complete = browser({ ready: true });
assert.equal(complete.intro.dataset.state, 'visible');
assert.equal(complete.storage.get('misterlove:intro-seen:v1'), '1', 'Visit must be remembered for this tab');
complete.advance(1199);
assert.ok(complete.classes.has('brand-intro-active'));
complete.advance(1200);
complete.assertDismissed();
cases++;

for (const loadTime of [300, 1600]) {
  const page = browser();
  page.advance(loadTime);
  page.fire('load');
  page.advance(Math.max(1200, loadTime));
  page.assertDismissed();
  cases++;
}
for (const storageBlocked of [false, true]) {
  const page = browser({ storageBlocked });
  page.advance(1949);
  assert.ok(page.classes.has('brand-intro-active'));
  page.advance(1950);
  page.assertDismissed();
  page.fire('load');
  assert.equal(page.timers.size, 0, 'Late loading must not reactivate the intro');
  cases++;
}
for (const interaction of ['pointerdown', 'keydown']) {
  const page = browser({ ready: true });
  page.advance(150);
  page.fire(interaction);
  page.assertDismissed();
  page.advance(3000);
  page.assertDismissed();
  cases++;
}
const restored = browser();
restored.fire('pageshow', { persisted: true });
restored.assertDismissed();
cases++;

console.log(`Brand intro: ${cases} lifecycle checks passed (ready/load/deadline, reduced motion, repeat visit, storage denial, early dismissal and history restore).`);
