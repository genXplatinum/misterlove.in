import { useEffect, useId, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import podcast from '../data/podcasts.json';
import { listenMeta } from '../data/podcastMeta';
import { PodcastPlayer, PLAYBACK_RATES, formatTime, matchingEpisodes } from '../lib/podcastPlayer';
import './Listen.css';

function Icon({ name, ...props }) {
  const paths = {
    play: <path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none" />,
    pause: <path d="M8 5v14M16 5v14" strokeWidth="4" />,
    previous: <><path d="M5 5v14" /><path d="m19 5-11 7 11 7Z" fill="currentColor" stroke="none" /></>,
    next: <><path d="M19 5v14" /><path d="m5 5 11 7-11 7Z" fill="currentColor" stroke="none" /></>,
    volume: <><path d="m11 4-5 4H2v8h4l5 4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
    muted: <><path d="m11 4-5 4H2v8h4l5 4ZM16 9l6 6m0-6-6 6" /></>,
    headphones: <><path d="M4 14v-3a8 8 0 0 1 16 0v3" /><rect x="3" y="12" width="4" height="8" rx="2" /><rect x="17" y="12" width="4" height="8" rx="2" /></>,
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    share: <><path d="M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8" /></>,
    download: <><path d="M12 3v12m-4-4 4 4 4-4M5 17v4h14v-4" /></>,
    search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
    book: <><path d="M12 5v16M3 3l9 2 9-2v16l-9 2-9-2Z" /></>,
  };
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

function Waveform({ episode, currentTime, duration, onSeek, active }) {
  const id = useId().replaceAll(':', '');
  const progress = duration ? Math.min(1, currentTime / duration) : 0;
  const peaks = episode?.waveform || [];
  return <div className={`podcast-waveform${active ? ' is-playing' : ''}`}>
    <svg viewBox="0 0 840 150" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-colour`} x1="0" x2="1"><stop stopColor="#edb778" /><stop offset=".48" stopColor="#e79699" /><stop offset="1" stopColor="#b4a8e3" /></linearGradient>
        <clipPath id={`${id}-played`}><rect width={840 * progress} height="150" /></clipPath>
      </defs>
      <g fill={`url(#${id}-colour)`} opacity=".45">{peaks.map((height, i) => <rect key={i} x={i * 5 + 1} y={75 - height * 65} width="3" height={Math.max(4, height * 130)} rx="1.5" />)}</g>
      <g fill={`url(#${id}-colour)`} clipPath={`url(#${id}-played)`}>{peaks.map((height, i) => <rect key={i} x={i * 5 + 1} y={75 - height * 65} width="3" height={Math.max(4, height * 130)} rx="1.5" />)}</g>
      <line className="podcast-waveform__cursor" x1={Math.max(1, progress * 840)} x2={Math.max(1, progress * 840)} y1="6" y2="144" stroke="#f7d4af" strokeWidth="1.5" />
    </svg>
    <input aria-label="Seek through chapter" aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`} type="range" min="0" max={duration || 1} step="1" value={Math.min(currentTime, duration || 1)} disabled={!episode} onChange={event => onSeek(Number(event.target.value))} />
  </div>;
}

function useListenMeta() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = listenMeta.title;
    const updates = {
      'meta[name="description"]': ['content', listenMeta.description],
      'link[rel="canonical"]': ['href', `https://misterlove.in${listenMeta.path}`],
      'meta[property="og:title"]': ['content', listenMeta.title],
      'meta[property="og:description"]': ['content', listenMeta.description],
      'meta[property="og:url"]': ['content', `https://misterlove.in${listenMeta.path}`],
      'meta[property="og:type"]': ['content', 'website'],
      'meta[property="og:image"]': ['content', `https://misterlove.in${listenMeta.image}`],
      'meta[property="og:image:secure_url"]': ['content', `https://misterlove.in${listenMeta.image}`],
      'meta[property="og:image:alt"]': ['content', listenMeta.imageAlt],
      'meta[name="twitter:title"]': ['content', listenMeta.title],
      'meta[name="twitter:description"]': ['content', listenMeta.description],
      'meta[name="twitter:image"]': ['content', `https://misterlove.in${listenMeta.image}`],
      'meta[name="twitter:image:alt"]': ['content', listenMeta.imageAlt],
    };
    const restore = Object.entries(updates).map(([selector, [attribute, value]]) => {
      const element = document.querySelector(selector);
      if (!element) return () => {};
      const before = element.getAttribute(attribute);
      element.setAttribute(attribute, value);
      return () => before === null ? element.removeAttribute(attribute) : element.setAttribute(attribute, before);
    });
    return () => { document.title = previousTitle; restore.forEach(fn => fn()); };
  }, []);
}

export default function Listen() {
  useListenMeta();
  const audioRef = useRef(null);
  const mainPlayerRef = useRef(null);
  const [params, setParams] = useSearchParams();
  const requestedChapter = Number(params.get('chapter'));
  const initialChapter = useRef(requestedChapter);
  const available = podcast.episodes.filter(episode => episode.src);
  const first = available[0];
  const [player, setPlayer] = useState(null);
  const [view, setView] = useState({ episode: first, phase: 'idle', currentTime: 0,
    duration: first?.duration || 0, volume: 0.8, muted: false, rate: 1, autoplay: true, positions: {} });
  const [query, setQuery] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const [shareFallback, setShareFallback] = useState('');
  const [mainPlayerVisible, setMainPlayerVisible] = useState(true);
  const totalSeconds = available.reduce((sum, episode) => sum + episode.duration, 0);
  const results = matchingEpisodes(podcast.episodes, query);
  const playing = view.phase === 'playing';
  const loading = view.phase === 'loading';
  const episode = view.episode;
  const index = available.findIndex(item => item.n === episode?.n);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => setMainPlayerVisible(entries[0].isIntersecting), { rootMargin: '-90px 0px 0px', threshold: 0.05 });
    observer.observe(mainPlayerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let storage;
    try { storage = window.localStorage; } catch { /* Audio also works without browser storage. */ }
    const controller = new PodcastPlayer(audioRef.current, podcast.episodes, { storage, initialChapter: initialChapter.current });
    const unsubscribe = controller.subscribe(setView);
    setPlayer(controller);
    const save = () => controller.save();
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', save);
    return () => {
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', save);
      unsubscribe();
      controller.destroy();
    };
  }, []);

  useEffect(() => {
    if (player && requestedChapter && requestedChapter !== player.state.episode?.n) player.select(requestedChapter);
  }, [player, requestedChapter]);

  useEffect(() => {
    if (!player || !episode) return;
    setParams(previous => {
      const next = new URLSearchParams(previous);
      next.set('chapter', String(episode.n));
      return next;
    }, { replace: true, preventScrollReset: true });
    setShareStatus('');
    setShareFallback('');
  }, [episode?.n, player, setParams]);

  useEffect(() => {
    if (!player || !('mediaSession' in navigator)) return;
    const actions = {
      play: () => player.play(), pause: () => player.pause(),
      previoustrack: () => player.move(-1), nexttrack: () => player.move(1),
      seekbackward: event => player.skip(-(event.seekOffset || 15)),
      seekforward: event => player.skip(event.seekOffset || 30),
      seekto: event => player.seek(event.seekTime),
    };
    Object.entries(actions).forEach(([action, handler]) => { try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* Optional browser feature. */ } });
    return () => Object.keys(actions).forEach(action => { try { navigator.mediaSession.setActionHandler(action, null); } catch { /* Optional browser feature. */ } });
  }, [player]);

  useEffect(() => {
    if (!player || !episode || !('mediaSession' in navigator)) return;
    if ('MediaMetadata' in window) navigator.mediaSession.metadata = new MediaMetadata({
      title: `Chapter ${episode.n}: ${episode.title}`, artist: 'MisterLove · Punjabi',
      album: podcast.title, artwork: [{ src: new URL(podcast.cover, window.location.origin).href, type: 'image/png' }],
    });
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    try { navigator.mediaSession.setPositionState({ duration: view.duration, playbackRate: view.rate, position: Math.min(view.currentTime, view.duration) }); } catch { /* Metadata may still be loading. */ }
    return () => { navigator.mediaSession.playbackState = 'none'; };
  }, [episode, player, playing, view.currentTime, view.duration, view.rate]);

  const share = async () => {
    if (!episode) return;
    const url = `${window.location.origin}/listen/?chapter=${episode.n}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus('Chapter link copied.');
      setShareFallback('');
    } catch {
      setShareFallback(url);
      setShareStatus('Copy the chapter link below.');
    }
  };

  return <div className="listening-room">
    <audio ref={audioRef} preload="none" aria-label="Punjabi chapter recording" />
    <header className="listen-hero listen-shell">
      <div><p className="listen-eyebrow"><Icon name="headphones" /> The listening room</p><h1>Books,<br /><em>in conversation.</em></h1><p className="listen-hero__lead">Follow the questions, one chapter at a time. Discussions of the books, made for listening.</p></div>
      <div className="listen-hero__aside"><span className="listen-live"><i /> Punjabi is live</span><p>English & Hindi<br /><span>Coming soon</span></p><a href="#podcast-player">Find your next chapter <Icon name="arrow" /></a></div>
    </header>

    <section className="listen-library listen-shell" aria-labelledby="listen-library-title">
      <div className="listen-section-label"><h2 id="listen-library-title">The podcasts</h2><span>01 collection</span></div>
      <div className="listen-studio" id="podcast-player">
        <aside className="listen-book">
          <div className="listen-book__art"><span className="listen-book__orbit" aria-hidden="true" /><img src={podcast.cover} alt="DEBUNKED: ISLAM by Lovepreet Singh" width="600" height="900" fetchPriority="high" /></div>
          <p className="listen-book__category">Religion · Evidence · Philosophy</p>
          <h2>{podcast.title}</h2><p className="listen-book__author">Based on the book by Lovepreet Singh</p>
          <p className="listen-book__description">A Punjabi conversation around each chapter: scripture, miracles, history and moral authority.</p>
          <div className="listen-book__facts"><span>{available.length} episodes available</span><span>{Math.floor(totalSeconds / 3600)}h {Math.round(totalSeconds % 3600 / 60)}m of listening</span></div>
          <Link className="listen-book__read" to="/writing/debunked-islam/"><Icon name="book" /> Read the complete book <Icon name="arrow" /></Link>
          <a className="listen-book__feed" href={listenMeta.feed}>Podcast RSS feed <Icon name="arrow" width="16" height="16" /></a>
        </aside>

        <div className="listen-desk">
          <section ref={mainPlayerRef} className="podcast-player" aria-labelledby="now-playing-title">
            <div className="podcast-player__topline"><span><i className={playing ? 'is-live' : ''} /> {playing ? 'Now playing' : loading ? 'Loading audio' : 'Ready when you are'}</span><span lang="pa">ਪੰਜਾਬੀ <span aria-hidden="true">/</span> Punjabi</span></div>
            <p className="podcast-player__chapter">Chapter {String(episode?.n || 1).padStart(2, '0')} <span>/ 36</span></p>
            <h2 id="now-playing-title">{episode?.title || 'Recordings are being prepared'}</h2>
            {episode?.titlePa && <p className="podcast-player__punjabi" lang="pa">{episode.titlePa}</p>}
            <Waveform episode={episode} currentTime={view.currentTime} duration={view.duration} onSeek={time => player?.seek(time)} active={playing} />
            <div className="podcast-player__time" aria-hidden="true"><span>{formatTime(view.currentTime)}</span><span>−{formatTime(Math.max(0, view.duration - view.currentTime))}</span></div>
            <div className="podcast-player__transport" role="group" aria-label="Playback controls">
              <button type="button" className="podcast-icon-button" aria-label="Previous chapter" title="Previous available chapter" disabled={!player || index <= 0} onClick={() => player.move(-1)}><Icon name="previous" /></button>
              <button type="button" className="podcast-skip" aria-label="Back 15 seconds" disabled={!player || !episode} onClick={() => player.skip(-15)}><span aria-hidden="true">↶</span><small>15</small></button>
              <button type="button" className={`podcast-play${loading ? ' is-loading' : ''}`} aria-label={playing || loading ? 'Pause' : 'Play'} disabled={!player || !episode} onClick={() => player.toggle()}><Icon name={playing || loading ? 'pause' : 'play'} width="30" height="30" /></button>
              <button type="button" className="podcast-skip" aria-label="Forward 30 seconds" disabled={!player || !episode} onClick={() => player.skip(30)}><span aria-hidden="true">↷</span><small>30</small></button>
              <button type="button" className="podcast-icon-button" aria-label="Next chapter" title="Next available chapter" disabled={!player || index < 0 || index === available.length - 1} onClick={() => player.move(1)}><Icon name="next" /></button>
            </div>
            <div className="podcast-player__preferences">
              <div className="podcast-volume"><button type="button" aria-label={view.muted || view.volume === 0 ? 'Unmute' : 'Mute'} disabled={!player} onClick={() => { if (view.volume === 0) player.setVolume(0.8); else player.toggleMute(); }}><Icon name={view.muted || view.volume === 0 ? 'muted' : 'volume'} width="20" height="20" /></button><input type="range" aria-label="Volume" min="0" max="1" step="0.05" value={view.muted ? 0 : view.volume} disabled={!player} onChange={event => player.setVolume(Number(event.target.value))} /></div>
              <label className="podcast-speed"><span>Speed</span><select aria-label="Playback speed" value={view.rate} disabled={!player} onChange={event => player.setRate(Number(event.target.value))}>{PLAYBACK_RATES.map(rate => <option key={rate} value={rate}>{rate}×</option>)}</select></label>
              <label className="podcast-autoplay"><input type="checkbox" checked={view.autoplay} disabled={!player} onChange={event => player.setAutoplay(event.target.checked)} /><span className="podcast-switch" aria-hidden="true" /><span>Autoplay next</span></label>
            </div>
            {view.error && <div className="podcast-error" role="alert"><p>{view.error}</p><button type="button" onClick={() => player.retry()}>Retry recording</button></div>}
            <div className="podcast-player__links">
              {episode && <><Link to={episode.readPath}>Read this chapter <Icon name="arrow" width="17" height="17" /></Link><button type="button" onClick={share}><Icon name="share" width="17" height="17" /> Share</button><a href={episode.src} aria-label={`Download audio for chapter ${episode.n}`} download={`debunked-islam-punjabi-chapter-${episode.n}.mp3`}><Icon name="download" width="17" height="17" /> Download</a></>}
            </div>
            <p className="podcast-share-status" role="status">{shareStatus}</p>
            {shareFallback && <input className="podcast-share-input" aria-label="Chapter link to copy" readOnly value={shareFallback} onFocus={event => event.target.select()} />}
          </section>

          <section className="podcast-queue" aria-labelledby="podcast-chapters-title">
            <div className="podcast-queue__heading"><div><p className="listen-eyebrow">The episode list</p><h2 id="podcast-chapters-title">Choose a chapter.</h2></div><span>{available.length} / 36 available</span></div>
            <div className="podcast-search"><Icon name="search" width="19" height="19" /><input type="search" aria-label="Search podcast chapters" placeholder="Search a question or chapter number" value={query} onChange={event => setQuery(event.target.value)} />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear chapter search">Clear</button>}</div>
            {available.length < 36 && <p className="podcast-queue__notice">More Punjabi chapters are being added. The list shows every chapter in the book; recordings play when available.</p>}
            <p className="podcast-result-count" role="status">{query ? `${results.length} matching ${results.length === 1 ? 'chapter' : 'chapters'}` : 'In book order · Pick up where you left off'}</p>
            <ol className="podcast-episodes">{results.map(item => {
              const selected = item.n === episode?.n;
              const position = Number(view.positions[item.n]) || 0;
              const completed = item.src && position >= item.duration - 2;
              return <li key={item.n} className={`${selected ? 'is-current' : ''}${item.src ? '' : ' is-unavailable'}`}>
                <button type="button" aria-current={selected ? 'true' : undefined} aria-label={`${selected && (playing || loading) ? 'Pause' : 'Play'} chapter ${item.n}: ${item.title}`} disabled={!item.src || !player} onClick={() => selected ? player.toggle() : player.select(item.n, { play: true })}>
                  <span className="podcast-episode__number">{selected && playing ? <span className="podcast-equalizer" aria-hidden="true"><i /><i /><i /></span> : String(item.n).padStart(2, '0')}</span>
                  <span className="podcast-episode__copy"><span className="podcast-episode__title">{item.title}</span><span className="podcast-episode__meta">{item.src ? <>{formatTime(item.duration)} <span>·</span> {completed ? 'Listened' : position > 2 ? `${formatTime(position)} played` : 'Punjabi discussion'}</> : 'Recording coming soon'}</span></span>
                  <span className="podcast-episode__action" aria-hidden="true">{item.src ? <Icon name={selected && (playing || loading) ? 'pause' : 'play'} width="20" height="20" /> : 'Soon'}</span>
                </button>
              </li>;
            })}</ol>
            {!results.length && <div className="podcast-empty"><p>No chapters match “{query}”.</p><button type="button" onClick={() => setQuery('')}>Show all chapters</button></div>}
          </section>
        </div>
      </div>
    </section>
    <section className="listen-closing listen-shell"><Icon name="headphones" width="34" height="34" /><div><h2>Keep your place. Keep the question.</h2><p>Your listening position is saved in this browser. These episodes discuss the book’s chapters; the complete text and its sources are available to read alongside them.</p></div><Link to="/writing/debunked-islam/">Open the book <Icon name="arrow" /></Link></section>
    {!mainPlayerVisible && episode && (view.phase === 'playing' || view.phase === 'loading' || view.phase === 'paused') && <aside className="podcast-mini" aria-label="Mini player">
      <button type="button" className="podcast-mini__title" aria-label="Return to full player" onClick={() => mainPlayerRef.current.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><span>Chapter {String(episode.n).padStart(2, '0')} · Punjabi</span><strong>{episode.title}</strong></button>
      <button type="button" aria-label="Previous chapter (mini player)" disabled={index <= 0} onClick={() => player.move(-1)}><Icon name="previous" width="19" height="19" /></button>
      <button type="button" className="podcast-mini__play" aria-label={playing || loading ? 'Pause (mini player)' : 'Play (mini player)'} onClick={() => player.toggle()}><Icon name={playing || loading ? 'pause' : 'play'} width="22" height="22" /></button>
      <button type="button" aria-label="Next chapter (mini player)" disabled={index === available.length - 1} onClick={() => player.move(1)}><Icon name="next" width="19" height="19" /></button>
    </aside>}
  </div>;
}
