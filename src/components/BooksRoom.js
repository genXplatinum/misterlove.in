import { useLayoutEffect } from 'react';
import { syncThemeColor } from '../pageSurface';

/**
 * Puts the /books routes in their own room.
 *
 * Every token the section overrides is declared on `:root.books-room` in
 * Books.css, and the nav, footer and buttons are entirely token-driven — so
 * adding one class here re-colours the whole page, shared furniture included,
 * without a single component knowing which room it is standing in.
 */
export default function useBooksRoom() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add('books-room');
    syncThemeColor();
    return () => {
      root.classList.remove('books-room');
      syncThemeColor();
    };
  }, []);
}
