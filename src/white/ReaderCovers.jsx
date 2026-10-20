import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import PublicationCover from './PublicationCover';
import { publicationForPath } from './publicationContext';

// White adds presentation to existing reader slots. Shared reader components,
// manuscripts, citations and download links retain their original ownership.
export default function ReaderCovers() {
  const { pathname } = useLocation();
  const [slot, setSlot] = useState(null);
  useEffect(() => {
    const main = document.getElementById('main');
    if (!main || !publicationForPath(pathname)) {
      setSlot(null);
      return undefined;
    }
    const sync = () => {
      const context = publicationForPath(pathname, main.querySelector('h1')?.textContent?.trim());
      const target = main.querySelector(context.isArticle ? '.article__head-aside' : '.topicpage__cover');
      if (!target) { setSlot(previous => previous ? null : previous); return; }
      const signature = `${pathname}:${context.title}:${context.label}`;
      setSlot(previous => previous?.target === target && previous.signature === signature
        ? previous : { target, signature, context });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(main, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [pathname]);
  if (!slot) return null;
  return createPortal(
    <div data-white-cover="true" className="white-cover-slot" aria-hidden="true">
      <PublicationCover piece={slot.context.piece} title={slot.context.title} label={slot.context.label} />
    </div>,
    slot.target,
    slot.signature,
  );
}
