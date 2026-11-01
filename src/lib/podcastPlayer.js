export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];
export const PODCAST_STORAGE_KEY = 'misterlove:podcast:debunked-islam:pa:v1';
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function formatTime(seconds = 0) {
  const total = Math.floor(Number.isFinite(seconds) ? Math.max(0, seconds) : 0);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function matchingEpisodes(episodes, query) {
  const value = query.trim().toLocaleLowerCase();
  if (!value) return episodes;
  const number = value.match(/^(?:chapter\s*)?0*(\d+)$/);
  if (number) return episodes.filter(episode => episode.n === Number(number[1]));
  return episodes.filter(episode => `${episode.n} chapter ${episode.n} ${episode.title} ${episode.titlePa}`.toLocaleLowerCase().includes(value));
}

// The element owns playback. UI state follows its events; promise resolution
// from an earlier selection may never start or relabel a later chapter.
export class PodcastPlayer {
  constructor(audio, episodes, { storage, initialChapter } = {}) {
    this.audio = audio;
    this.episodes = episodes.filter(episode => episode.src);
    this.storage = storage;
    this.listeners = new Set();
    this.events = [];
    this.generation = 0;
    this.wantsPlay = false;
    this.destroyed = false;
    this.pendingSeek = null;
    this.lastSaved = -1;
    let saved = {};
    try { saved = JSON.parse(storage?.getItem(PODCAST_STORAGE_KEY) || '{}') || {}; } catch { /* Storage is optional. */ }
    this.positions = saved.positions && typeof saved.positions === 'object' ? saved.positions : {};
    const volume = Number.isFinite(saved.volume) ? clamp(saved.volume, 0, 1) : 0.8;
    const rate = PLAYBACK_RATES.includes(saved.rate) ? saved.rate : 1;
    this.state = { episode: null, phase: 'idle', currentTime: 0, duration: 0,
      volume, muted: saved.muted === true, rate, autoplay: saved.autoplay !== false,
      error: '', positions: { ...this.positions } };
    audio.volume = volume;
    audio.muted = this.state.muted;
    audio.playbackRate = rate;
    audio.preload = 'none';
    this.bind('loadedmetadata', () => {
      if (!this.isCurrent()) return;
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : this.state.duration;
      this.update({ duration });
      if (this.pendingSeek !== null) {
        audio.currentTime = clamp(this.pendingSeek, 0, duration);
        this.pendingSeek = null;
      }
      audio.playbackRate = this.state.rate;
    });
    this.bind('playing', () => {
      if (!this.isCurrent()) return;
      if (!this.wantsPlay) { audio.pause(); return; }
      this.update({ phase: 'playing', error: '' });
    });
    this.bind('pause', () => {
      if (!this.isCurrent() || this.state.phase === 'ended' || this.state.phase === 'error') return;
      // A platform interruption can pause the element without using our
      // buttons. Ignore an old queued pause event once a new play has begun.
      if (!audio.paused) return;
      this.wantsPlay = false;
      this.update({ phase: 'paused' });
      this.save();
    });
    this.bind('waiting', () => {
      if (this.isCurrent() && this.wantsPlay) this.update({ phase: 'loading' });
    });
    this.bind('timeupdate', () => {
      if (!this.isCurrent() || this.pendingSeek !== null) return;
      this.update({ currentTime: clamp(audio.currentTime || 0, 0, this.state.duration) });
      const tick = Math.floor(this.state.currentTime / 5);
      if (tick !== this.lastSaved) { this.lastSaved = tick; this.save(); }
    });
    this.bind('ended', () => {
      if (!this.isCurrent()) return;
      this.wantsPlay = false;
      this.update({ currentTime: this.state.duration, phase: 'ended' });
      this.save();
      if (this.state.autoplay && this.neighbour(1)) this.select(this.neighbour(1).n, { play: true });
    });
    this.bind('error', () => {
      if (!this.isCurrent()) return;
      this.wantsPlay = false;
      this.update({ phase: 'error', error: 'This recording could not be loaded. Check your connection and try again.' });
    });
    const first = this.episodes.find(episode => episode.n === initialChapter)
      || this.episodes.find(episode => episode.n === saved.currentChapter) || this.episodes[0];
    if (first) this.select(first.n);
  }

  bind(event, listener) {
    this.audio.addEventListener(event, listener);
    this.events.push([event, listener]);
  }

  isCurrent() {
    if (this.destroyed || !this.state.episode) return false;
    const current = this.audio.currentSrc;
    if (!current) return true;
    try { return new URL(current, 'https://misterlove.in').pathname === this.state.episode.src; }
    catch { return false; }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  update(change) {
    if (this.destroyed) return;
    this.state = { ...this.state, ...change };
    this.listeners.forEach(listener => listener(this.state));
  }

  neighbour(direction) {
    const index = this.episodes.findIndex(episode => episode.n === this.state.episode?.n);
    return this.episodes[index + direction] || null;
  }

  select(number, { play = false, restart = false } = {}) {
    const episode = this.episodes.find(item => item.n === number);
    if (!episode || this.destroyed) return false;
    this.save();
    this.generation++;
    this.wantsPlay = false;
    this.audio.pause();
    const saved = Number(this.positions[number]);
    const position = !restart && Number.isFinite(saved) && saved > 0 && saved < episode.duration - 2 ? saved : 0;
    this.pendingSeek = position;
    this.lastSaved = -1;
    this.update({ episode, phase: 'idle', currentTime: position, duration: episode.duration, error: '' });
    this.audio.preload = 'none';
    this.audio.src = episode.src;
    this.audio.load();
    this.audio.playbackRate = this.state.rate;
    this.save();
    if (play) void this.play();
    return true;
  }

  async play() {
    if (!this.state.episode || this.destroyed) return;
    if (this.state.phase === 'ended') this.seek(0);
    const generation = this.generation;
    this.wantsPlay = true;
    this.update({ phase: 'loading', error: '' });
    try {
      await this.audio.play();
      if (this.destroyed || generation !== this.generation) return;
      if (!this.wantsPlay) this.audio.pause();
    } catch (error) {
      if (this.destroyed || generation !== this.generation || !this.wantsPlay) return;
      if (error.name === 'AbortError') return;
      this.wantsPlay = false;
      this.update({ phase: 'error', error: error.name === 'NotAllowedError'
        ? 'Your browser paused playback. Press play to start the recording.'
        : 'Playback could not start. Check your connection and try again.' });
    }
  }

  pause() {
    this.wantsPlay = false;
    this.audio.pause();
    this.update({ phase: 'paused' });
    this.save();
  }

  toggle() {
    if (this.wantsPlay) this.pause();
    else if (this.state.phase === 'error') this.retry();
    else void this.play();
  }

  retry() {
    if (!this.state.episode) return;
    this.select(this.state.episode.n, { play: true });
  }

  seek(seconds) {
    if (!this.state.episode || !Number.isFinite(seconds)) return;
    const time = clamp(seconds, 0, this.state.duration);
    this.pendingSeek = time;
    if (this.audio.readyState > 0) {
      try { this.audio.currentTime = time; this.pendingSeek = null; } catch { /* Apply after metadata. */ }
    }
    this.update({ currentTime: time });
    this.save();
  }

  skip(seconds) { this.seek(this.state.currentTime + seconds); }

  move(direction) {
    const episode = this.neighbour(direction);
    if (episode) this.select(episode.n, { play: this.wantsPlay });
  }

  setVolume(value) {
    if (!Number.isFinite(value)) return;
    const volume = clamp(value, 0, 1);
    this.audio.volume = volume;
    this.audio.muted = false;
    this.update({ volume, muted: false });
    this.save();
  }

  toggleMute() {
    const muted = !this.state.muted;
    this.audio.muted = muted;
    this.update({ muted });
    this.save();
  }

  setRate(rate) {
    if (!PLAYBACK_RATES.includes(rate)) return;
    this.audio.playbackRate = rate;
    this.update({ rate });
    this.save();
  }

  setAutoplay(autoplay) { this.update({ autoplay: Boolean(autoplay) }); this.save(); }

  save() {
    if (this.state.episode) this.positions[this.state.episode.n] = this.state.currentTime;
    this.state = { ...this.state, positions: { ...this.positions } };
    try { this.storage?.setItem(PODCAST_STORAGE_KEY, JSON.stringify({
      currentChapter: this.state.episode?.n, positions: this.positions,
      volume: this.state.volume, muted: this.state.muted,
      rate: this.state.rate, autoplay: this.state.autoplay,
    })); } catch { /* Private browsing/full storage must not interrupt audio. */ }
  }

  destroy() {
    this.save();
    this.destroyed = true;
    this.generation++;
    this.wantsPlay = false;
    this.events.forEach(([event, listener]) => this.audio.removeEventListener(event, listener));
    this.listeners.clear();
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
  }
}
