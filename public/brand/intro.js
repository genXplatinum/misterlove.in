(() => {
  const key = 'misterlove:intro-seen:v1';
  const root = document.documentElement;
  const intro = document.getElementById('brand-intro');
  if (!intro || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch { /* A blocked storage API must never block the site. */ }
  const started = performance.now();
  let dismissed = false;
  let readyTimer;
  root.classList.add('brand-intro-active');
  intro.dataset.state = 'visible';
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(readyTimer);
    clearTimeout(deadline);
    root.classList.remove('brand-intro-active');
    intro.dataset.state = 'dismissed';
    window.removeEventListener('load', ready);
    window.removeEventListener('pageshow', restored);
    window.removeEventListener('pointerdown', dismiss);
    window.removeEventListener('keydown', dismiss);
  };
  const ready = () => {
    readyTimer = setTimeout(dismiss, Math.max(0, 1200 - (performance.now() - started)));
  };
  const restored = event => { if (event.persisted) dismiss(); };
  const deadline = setTimeout(dismiss, 1950);
  window.addEventListener('pointerdown', dismiss, { once: true });
  window.addEventListener('keydown', dismiss, { once: true });
  window.addEventListener('pageshow', restored);
  if (document.readyState === 'complete') ready();
  else window.addEventListener('load', ready, { once: true });
})();
