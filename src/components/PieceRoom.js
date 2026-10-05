import { useLayoutEffect } from 'react';
import { syncThemeColor } from '../pageSurface';

export const roomClass = (room) => (room ? `room-${room}` : '');

/**
 * Puts one piece in its own room.
 *
 * Both room hooks put their class on the root. The page canvas resolves
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
  useLayoutEffect(() => {
    if (!room) return undefined;

    /* Captured now, deliberately: at cleanup time `room` would already be the
       next piece's, and the wrong class would come off. */
    const className = roomClass(room);
    const root = document.documentElement;
    root.classList.add(className);

    syncThemeColor();

    return () => {
      root.classList.remove(className);
      syncThemeColor();
    };
  }, [room]);
}
