import { useEffect } from 'react';

/* The room's ground, so the browser chrome on a phone matches the page
   instead of staying the library's cream. */
const GROUND = { light: '#E8E6DE', dark: '#15191A' };

/**
 * Puts the /books routes in their own room.
 *
 * Every token the section overrides is declared on `body.books-room` in
 * Books.css, and the nav, footer and buttons are entirely token-driven — so
 * adding one class here re-colours the whole page, shared furniture included,
 * without a single component knowing which room it is standing in.
 */
export default function useBooksRoom() {
  useEffect(() => {
    document.body.classList.add('books-room');

    const meta = document.querySelector('meta[name="theme-color"]');
    const previous = meta?.getAttribute('content');
    const paint = () => meta?.setAttribute(
      'content',
      document.documentElement.dataset.theme === 'dark' ? GROUND.dark : GROUND.light
    );

    paint();
    /* The reader's theme toggle writes data-theme on the root, so follow it
       rather than reading the preference twice. */
    const observer = new MutationObserver(paint);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      document.body.classList.remove('books-room');
      observer.disconnect();
      if (previous) meta?.setAttribute('content', previous);
    };
  }, []);
}
