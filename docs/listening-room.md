# Listening room

The listening room is `/listen/`, with the shared player also available at
`/white/listen/`. `/podcasts/` redirects to the main room. The launch collection
contains 36 Punjabi discussions of the chapters of **DEBUNKED: ISLAM**. English
and Hindi are labelled as forthcoming; their unfinished audio is not published.

## Media and titles

`src/data/podcasts.json` is the public episode catalogue. The numbered recordings
map to the 36 chapter anchors in the checked online book. Each episode has its
chapter number and distinct book title; repeated source titles have distinct
Punjabi display names too, as authorised by the author. The originals in Drive
retain their filenames. An additional unnumbered recording is not silently
assigned to a chapter or counted as a thirty-seventh episode.

The committed MP3 files are 96 kb/s mono at 44.1 kHz. They preserve the full
duration of each source recording. Source hashes, original metadata, measured
durations and full decoding results are held in the private import audit. Public
file hashes and durations are in `public/audio/debunked-islam/pa/manifest.json`.
All 36 derivative files passed full decoding. Their combined measured duration
is 35,717.287 seconds, or approximately 9 hours 55 minutes.

Waveforms contain 168 amplitude measurements from each actual recording. They
are not random placeholders. No audio downloads until the listener starts a
recording. Only one media element plays, and changing routes releases it.

To reimport, use the local Python/FFmpeg workflow with explicit source,
repository and private audit directories:

```text
python scripts/prepare-podcast-media.py --source "<local Drive folder>" --repo . --report "<private audit directory>"
```

The importer never writes to the source folder. Review its chapter inventory,
unassigned files and titles, refresh the public manifest, then run the checks.
Generation or translation of new recordings is a separate task.

## Player behaviour

- Play/pause, previous/next chapter, back 15 seconds and forward 30 seconds.
- Pointer and keyboard seeking through the waveform; volume and mute.
- Six playback speeds, from 0.75× to 2×, and optional automatic advancement.
- Per-chapter position, selected chapter and settings saved in browser storage.
- A compact player remains available while browsing beyond the full player.
- Exact chapter-number search, English and Punjabi text search, and clear states.
- Direct chapter links, copy-link fallback, MP3 downloads and matching book links.
- Media Session controls where supported; clear errors and a retry action.
- Reduced-motion styles, accessible labels and keyboard focus states.

The podcast RSS feed is `/podcasts/debunked-islam-pa.xml`. Its 36 enclosures use
stable, same-origin media URLs and measured byte sizes. Artwork includes a
1400×1400 podcast cover and a separate 1200×630 social card.

## Validation

```text
npm run test:podcast
npm run lint
npm run build
npm run validate:podcast
```

The production build generates Original and White HTML, canonical and social
metadata, PodcastSeries/PodcastEpisode structured data, RSS and a sitemap entry.
Media validation checks all 36 hashes, unique titles and files, durations,
waveforms, chapter anchors, cover sizes, RSS enclosures and deployment size.

The development browser checks on 1 November 2026 used the built-in browser.
Every numbered episode button started its matching recording with decoded
media ready. The controls, volume/mute, all listed playback features, exact
search, share confirmation, refresh/resume, rapid chapter changes, autoplay,
final-chapter stop and retry after a deliberately blocked request were checked.
The downloaded Chapter 2 MP3 matched its expected SHA-256. The reading link
reached its correct chapter anchor and released the player. Both editions and
mobile/desktop layouts were inspected; this is browser viewport testing, not a
claim of testing every physical device or browser engine. Live deployment
verification is recorded separately after publication.
