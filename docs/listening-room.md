# Listening room

The listening room is `/listen/` in the primary White edition and
`/original/listen/` in the secondary Original edition. The former White URL
`/white/listen/` redirects to `/listen/`; `/podcasts/` also redirects to the
main room. The listening room contains 36 Punjabi discussions of **DEBUNKED:
ISLAM**, plus eight English and eight Hindi episodes in **The Architecture of
Money**. The series selector uses the same player and episode cards for every
language.

## Media and titles

`src/data/podcasts.json` and `src/data/architecture-of-money.json` are the public episode catalogues. The numbered recordings
map to the 36 chapter anchors in the checked online book. Each episode has its
chapter number and distinct book title; repeated source titles have distinct
Punjabi display names too, as authorised by the author. Architecture of Money
parts keep the source titles, with original filenames recorded in each language
manifest. The supplied source files remain unchanged in the user Documents folder.

The DEBUNKED: ISLAM MP3 files are 96 kb/s mono at 44.1 kHz. The Architecture of Money MP3 files are 40 kb/s mono at 44.1 kHz to keep the complete site within its published deployment-size limit. Both sets preserve the full duration of each source recording. Source hashes, original metadata, measured
durations and full decoding results for DEBUNKED: ISLAM are held in its private
import audit. Public file hashes and durations are in the series manifests. All
52 derivative files passed full decoding; the original series runs approximately
9 hours 55 minutes.

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

The production build generates White and Original HTML, primary canonical and
social metadata, secondary noindex metadata, PodcastSeries/PodcastEpisode
structured data, RSS and a sitemap entry.
Media validation checks all 52 audio hashes, unique titles and files, durations,
waveforms, chapter anchors, cover dimensions, RSS enclosures and deployment size.

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
