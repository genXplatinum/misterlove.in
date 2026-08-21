import { useEffect } from 'react';

/* The grounds a room paints its browser chrome with, keyed the way the manifest
   keys `room:`. postbuild.mjs carries the same table for the pre-rendered
   shells; the two are unlinked and have to be kept in step by hand, exactly as
   BooksRoom.js and BOOKS_GROUND already are. */
export const ROOM_GROUND = {
  origin: { light: '#FBF6EA', dark: '#171310' },
};

/* The library's own ground, restored on the way out. Reading it off the live
   meta tag instead — the way the /books hook does — gives the wrong answer on a
   pre-rendered room shell, because postbuild has already written the room's
   colour there. */
const LIBRARY_GROUND = { light: '#F3EFE6', dark: '#171512' };

export const roomClass = (room) => (room ? `room-${room}` : '');

/**
 * Puts one piece in its own room.
 *
 * The class goes on the root element rather than on <body>, which is the one
 * difference from useBooksRoom. `html { background: var(--canvas) }` resolves
 * on the root, so a body-level class leaves the library's cream in the
 * overscroll band and in the scrollbar track; stamping the root catches those,
 * and lets the room set its own `color-scheme` as well.
 *
 * The dependency is the room name, not an empty array. React Router renders the
 * same <Article> element for every piece, so the component instance is reused
 * across a navigation from one piece to another — a mount-once effect would
 * stamp the first room and never take it off again. Keying on the room name
 * also means moving between parts of the same piece does not re-run the effect
 * at all, so there is no frame where the reader flashes back to cream.
 */
export default function useRoom(room) {
  useEffect(() => {
    if (!room) return undefined;

    /* Captured now, deliberately: at cleanup time `room` would already be the
       next piece's, and the wrong class would come off. */
    const className = roomClass(room);
    const ground = ROOM_GROUND[room] ?? LIBRARY_GROUND;
    const root = document.documentElement;
    root.classList.add(className);

    const meta = document.querySelector('meta[name="theme-color"]');
    /* ThemeProvider writes the library's colours into this tag on every theme
       change, so the room has to write after it rather than once. It sets
       data-theme before the meta, and a MutationObserver callback runs as a
       microtask after the current task, so this always lands last. */
    const paint = () => meta?.setAttribute(
      'content',
      root.dataset.theme === 'dark' ? ground.dark : ground.light
    );

    paint();
    const observer = new MutationObserver(paint);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      root.classList.remove(className);
      observer.disconnect();
      meta?.setAttribute(
        'content',
        root.dataset.theme === 'dark' ? LIBRARY_GROUND.dark : LIBRARY_GROUND.light
      );
    };
  }, [room]);
}
