import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import podcast from '../src/data/podcasts.json' with { type: 'json' };
import book from '../src/data/writing/debunked-islam.js';
import { listenMeta } from '../src/data/podcastMeta.js';

const media = JSON.parse(readFileSync('public/audio/debunked-islam/pa/manifest.json', 'utf8'));
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const episodes = podcast.episodes;
assert.equal(episodes.length, 36);
assert.equal(media.count, 36);
assert.equal(new Set(episodes.map(episode => episode.n)).size, 36);
assert.equal(new Set(episodes.map(episode => episode.title)).size, 36);
assert.equal(new Set(episodes.map(episode => episode.src)).size, 36);
assert.equal(new Set(media.files.map(file => file.sha256)).size, 36, 'Audio files must be distinct');
const chapterIds = new Set(book[0].toc.map(chapter => chapter.id));
for (let i = 0; i < episodes.length; i++) {
  const episode = episodes[i];
  assert.equal(episode.n, i + 1);
  assert.ok(episode.src, `Missing chapter ${episode.n}`);
  assert.ok(episode.duration > 60);
  assert.equal(episode.waveform.length, 168);
  assert.ok(episode.waveform.every(value => Number.isFinite(value) && value > 0 && value <= 1));
  assert.ok(chapterIds.has(`chapter-${episode.n}`));
  const file = `public${episode.src}`;
  const record = media.files.find(item => item.n === episode.n);
  assert.equal(statSync(file).size, episode.bytes);
  assert.equal(record.bytes, episode.bytes);
  assert.equal(hash(file), record.sha256);
  assert.equal(record.full_decode_passed, true);
  assert.ok(Math.abs(record.duration - episode.duration) < .001);
}
const images = [[listenMeta.image, 1200, 630], [listenMeta.artwork, 1400, 1400]];
for (const [path, width, height] of images) {
  const data = readFileSync(`public${path}`);
  assert.equal(data.readUInt32BE(16), width);
  assert.equal(data.readUInt32BE(20), height);
}
if (existsSync('dist/listen/index.html')) {
  for (const path of ['dist/listen/index.html', 'dist/white/listen/index.html']) {
    const html = readFileSync(path, 'utf8');
    assert.ok(html.includes('<title>Listen Books &amp; Podcasts | MisterLove</title>'));
    assert.ok(html.includes('<link rel="canonical" href="https://misterlove.in/listen/"'));
    assert.ok(html.includes('property="og:image" content="https://misterlove.in/og/listen.png"'));
    assert.ok(html.includes('Seek through chapter'));
    assert.ok(html.includes('Playback speed'));
    assert.ok(html.includes('Autoplay next'));
    assert.ok(html.includes('Search podcast chapters'));
    assert.ok(!html.includes('Recording coming soon'));
    const data = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
    const series = data.flatMap(item => item['@graph'] || [item]).find(item => item['@type'] === 'PodcastSeries');
    assert.equal(series.episode.length, 36);
    if (path.includes('/white/')) assert.ok(html.includes('noindex, follow'));
  }
  const feed = readFileSync(`dist${listenMeta.feed}`, 'utf8');
  assert.equal((feed.match(/<enclosure /g) || []).length, 36);
  for (const episode of episodes) {
    assert.ok(feed.includes(`url="https://misterlove.in${episode.src}" length="${episode.bytes}" type="audio/mpeg"`));
    assert.equal(statSync(`dist${episode.src}`).size, episode.bytes);
  }
  assert.ok(readFileSync('dist/sitemap.xml', 'utf8').includes('<loc>https://misterlove.in/listen/</loc>'));
  const size = directory => readdirSync(directory, { withFileTypes: true }).reduce((total, entry) => {
    const path = `${directory}/${entry.name}`;
    return total + (entry.isDirectory() ? size(path) : statSync(path).size);
  }, 0);
  const bytes = size('dist');
  assert.ok(bytes < 1000 * 1024 * 1024, 'The complete GitHub Pages site must fit its published size limit');
  console.log(`podcast ✓ Original + White HTML, 36-episode RSS, sitemap, metadata, copied media; total deployment ${(bytes / 1024 / 1024).toFixed(1)} MiB`);
}
console.log('podcast ✓ 36 distinct audio files, hashes, measured durations, real waveforms, chapter anchors and cover dimensions');
