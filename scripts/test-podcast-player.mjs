import assert from 'node:assert/strict';
import test from 'node:test';
import { PodcastPlayer, PODCAST_STORAGE_KEY, formatTime, matchingEpisodes } from '../src/lib/podcastPlayer.js';

class FakeAudio extends EventTarget {
  constructor() {
    super(); this.src = ''; this.currentSrc = ''; this.currentTime = 0;
    this.duration = 300; this.readyState = 0; this.paused = true;
    this.playImplementation = null;
  }
  load() { this.currentSrc = ''; this.readyState = 0; this.currentTime = 0; }
  metadata() { this.currentSrc = this.src; this.readyState = 1; this.dispatchEvent(new Event('loadedmetadata')); }
  play() {
    if (this.playImplementation) return this.playImplementation();
    this.metadata(); this.paused = false; this.dispatchEvent(new Event('playing')); return Promise.resolve();
  }
  pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
  removeAttribute(name) { if (name === 'src') this.src = ''; }
  time(seconds) { this.currentTime = seconds; this.dispatchEvent(new Event('timeupdate')); }
  end() { this.currentTime = this.duration; this.paused = true; this.dispatchEvent(new Event('ended')); }
}
const episodes = [1, 2, 3].map(n => ({ n, title: `Question ${n}`, titlePa: n === 2 ? 'ਪੰਜਾਬੀ' : '', src: `/audio/chapter-${n}.mp3`, duration: 300 }));
const makeStorage = initial => {
  const saved = new Map(initial ? [[PODCAST_STORAGE_KEY, JSON.stringify(initial)]] : []);
  return { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
};
const setup = options => {
  const audio = new FakeAudio(); const storage = makeStorage();
  const player = new PodcastPlayer(audio, episodes, { storage, ...options });
  return { audio, player, storage };
};

test('play and pause follow the media element, including pause while buffering', async () => {
  const { audio, player } = setup();
  assert.equal(audio.paused, true); assert.equal(player.state.phase, 'idle');
  await player.play(); assert.equal(player.state.phase, 'playing');
  player.toggle(); assert.equal(audio.paused, true); assert.equal(player.state.phase, 'paused');
  let resolve;
  audio.playImplementation = () => new Promise(done => { resolve = done; });
  const pending = player.play(); assert.equal(player.state.phase, 'loading');
  player.pause(); resolve(); await pending;
  assert.equal(audio.paused, true); assert.equal(player.state.phase, 'paused');
  player.destroy();
});

test('seeking before metadata is restored and skip buttons clamp at both ends', async () => {
  const { audio, player } = setup();
  player.seek(123); assert.equal(player.state.currentTime, 123);
  await player.play(); assert.equal(audio.currentTime, 123);
  player.skip(-200); assert.equal(audio.currentTime, 0);
  player.skip(600); assert.equal(audio.currentTime, 300);
  player.seek(NaN); assert.equal(player.state.currentTime, 300);
  player.destroy();
});

test('a native pause interruption updates the button state and playback intent', async () => {
  const { audio, player } = setup();
  await player.play(); audio.pause();
  assert.equal(player.state.phase, 'paused'); assert.equal(player.wantsPlay, false);
  player.toggle(); assert.equal(player.state.phase, 'playing');
  player.destroy();
});

test('previous/next preserve playback intent and respect chapter boundaries', async () => {
  const { player } = setup();
  player.move(-1); assert.equal(player.state.episode.n, 1);
  player.move(1); assert.equal(player.state.episode.n, 2); assert.equal(player.wantsPlay, false);
  await player.play(); player.move(1);
  assert.equal(player.state.episode.n, 3); assert.equal(player.wantsPlay, true);
  player.move(1); assert.equal(player.state.episode.n, 3);
  player.move(-1); assert.equal(player.state.episode.n, 2);
  player.destroy();
});

test('autoplay advances, can be disabled, and stops after the final recording', async () => {
  const { audio, player } = setup();
  await player.play(); audio.end(); assert.equal(player.state.episode.n, 2);
  player.setAutoplay(false); audio.end(); assert.equal(player.state.episode.n, 2); assert.equal(player.state.phase, 'ended');
  await player.play(); assert.equal(audio.currentTime, 0);
  player.setAutoplay(true); player.select(3, { play: true }); audio.end();
  assert.equal(player.state.phase, 'ended'); assert.equal(player.wantsPlay, false);
  player.destroy();
});

test('volume, mute, playback speed, current chapter and positions survive reload', async () => {
  const storage = makeStorage(); const { audio, player } = setup({ storage });
  player.select(2, { play: true }); audio.time(87); player.pause();
  player.setVolume(.3); player.toggleMute(); player.setRate(1.5); player.setAutoplay(false); player.destroy();
  const restored = setup({ storage });
  assert.equal(restored.player.state.episode.n, 2); assert.equal(restored.player.state.currentTime, 87);
  assert.equal(restored.audio.volume, .3); assert.equal(restored.audio.muted, true);
  assert.equal(restored.audio.playbackRate, 1.5); assert.equal(restored.player.state.autoplay, false);
  await restored.player.play(); assert.equal(restored.audio.currentTime, 87);
  restored.player.setRate(9); assert.equal(restored.audio.playbackRate, 1.5);
  restored.player.destroy();
});

test('late rejection from an old chapter never corrupts a new chapter', async () => {
  const { audio, player } = setup(); let reject;
  audio.playImplementation = () => new Promise((_, no) => { reject = no; });
  const oldPlay = player.play();
  audio.playImplementation = null; player.select(3, { play: true });
  reject(new Error('old request failed')); await oldPlay;
  assert.equal(player.state.episode.n, 3); assert.equal(player.state.phase, 'playing'); assert.equal(player.state.error, '');
  player.destroy();
});

test('network failures expose a retry and retry keeps the saved position', async () => {
  const { audio, player } = setup(); await player.play(); audio.time(82);
  audio.dispatchEvent(new Event('error')); assert.equal(player.state.phase, 'error'); assert.ok(player.state.error);
  player.retry(); assert.equal(player.state.phase, 'playing'); assert.equal(audio.currentTime, 82);
  player.destroy();
});

test('blocked playback and unavailable storage do not crash the player', async () => {
  const storage = { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); } };
  const { audio, player } = setup({ storage });
  audio.playImplementation = () => Promise.reject(Object.assign(new Error(), { name: 'NotAllowedError' }));
  await player.play(); assert.equal(player.state.phase, 'error'); assert.match(player.state.error, /Press play/);
  audio.playImplementation = null; player.retry(); assert.equal(player.state.phase, 'playing');
  player.destroy();
});

test('unavailable chapters are skipped, explicit valid links win over saved selection', () => {
  const audio = new FakeAudio(); const sparse = [episodes[0], { ...episodes[1], src: null }, episodes[2]];
  const player = new PodcastPlayer(audio, sparse, { storage: makeStorage({ currentChapter: 3 }), initialChapter: 1 });
  assert.equal(player.state.episode.n, 1); assert.equal(player.select(2), false);
  player.move(1); assert.equal(player.state.episode.n, 3); player.destroy();
});

test('search works by number, English and Punjabi; time labels are safe', () => {
  assert.equal(matchingEpisodes(episodes, 'chapter 2')[0].n, 2);
  assert.deepEqual(matchingEpisodes([...episodes, { ...episodes[1], n: 20 }], '2').map(episode => episode.n), [2]);
  assert.equal(matchingEpisodes(episodes, 'ਪੰਜਾਬੀ')[0].n, 2);
  assert.equal(matchingEpisodes(episodes, 'absent').length, 0);
  assert.equal(matchingEpisodes(episodes, ' ').length, 3);
  assert.equal(formatTime(3661), '61:01'); assert.equal(formatTime(NaN), '0:00');
});
