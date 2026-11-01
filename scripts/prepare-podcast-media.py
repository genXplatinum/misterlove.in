"""Prepare public podcast derivatives without altering the Drive originals."""
from pathlib import Path
import argparse
import array
import hashlib
import json
import math
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def probe(path):
    result = subprocess.run(['ffprobe', '-v', 'error', '-show_entries',
        'format=duration,size:stream=codec_name,sample_rate,channels', '-of', 'json', str(path)],
        capture_output=True, check=True)
    return json.loads(result.stdout)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', required=True)
    parser.add_argument('--repo', required=True)
    parser.add_argument('--report', required=True)
    args = parser.parse_args()
    repo, source, report = Path(args.repo), Path(args.source), Path(args.report)
    report.mkdir(parents=True, exist_ok=True)
    media = repo/'public/audio/debunked-islam/pa'
    media.mkdir(parents=True, exist_ok=True)
    article = (repo/'src/data/writing/debunked-islam.js').read_text(encoding='utf-8')
    book = json.loads(article.split('export default ', 1)[1].strip().rstrip(';'))[0]
    titles = {int(t['id'].split('-')[1]): re.sub(r'^Chapter \d+:\s*', '', t['text'])
              for t in book['toc'] if re.fullmatch(r'chapter-\d+', t['id'])}
    assert len(titles) == 36
    sources, unnumbered = {}, []
    for path in source.iterdir():
        if not path.is_file() or path.suffix.lower() not in ('.m4a', '.mp3', '.wav', '.ogg', '.opus'):
            continue
        match = re.match(r'Chap(?:ter|er)[ _-]*(\d+)', path.name, re.I)
        if not match:
            unnumbered.append(path.name)
            continue
        number = int(match[1])
        assert 1 <= number <= 36 and number not in sources, path
        sources[number] = path

    def process(number, path):
        target = media/f'chapter-{number:02}.mp3'
        source_hash = digest(path)
        old_path = report/f'chapter-{number:02}.json'
        old = json.loads(old_path.read_text(encoding='utf-8')) if old_path.exists() else {}
        if old.get('source_sha256') == source_hash and target.exists() and digest(target) == old.get('sha256'):
            print(f'Chapter {number}: verified existing derivative', flush=True)
            return old
        source_probe = probe(path)
        title_pa = re.sub(r'^Chap(?:ter|er)[ _-]*\d+[ _-]*', '', path.stem, flags=re.I).replace('_', ' ').strip()
        subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', str(path),
            '-map', '0:a:0', '-vn', '-map_metadata', '-1', '-ac', '1', '-ar', '44100',
            '-codec:a', 'libmp3lame', '-b:a', '96k', '-id3v2_version', '3',
            '-metadata', f'title=Chapter {number} - {titles[number]}',
            '-metadata', 'album=DEBUNKED: ISLAM - Punjabi chapter discussions',
            '-metadata', 'artist=MisterLove', str(target)], check=True)
        encoded_probe = probe(target)
        duration = float(encoded_probe['format']['duration'])
        assert abs(duration-float(source_probe['format']['duration'])) < 0.15
        # Entire derivative is decoded: catches corrupt/truncated audio as well as
        # producing waveform samples. No browser decodes 36 files at page load.
        decoded = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(target),
            '-map', '0:a:0', '-ac', '1', '-ar', '800', '-f', 's16le', '-'],
            capture_output=True, check=True).stdout
        samples = array.array('h', decoded)
        bins = 168
        step = max(1, math.ceil(len(samples)/bins))
        peaks = []
        for i in range(bins):
            chunk = samples[i*step:(i+1)*step]
            rms = math.sqrt(sum(v*v for v in chunk)/len(chunk)) if chunk else 0
            peaks.append(rms)
        maximum = max(peaks) or 1
        peaks = [round(max(0.025, min(1, value/maximum)), 3) for value in peaks]
        record = {'n': number, 'title': titles[number], 'titlePa': title_pa,
            'src': f'/audio/debunked-islam/pa/chapter-{number:02}.mp3',
            'duration': round(duration, 3), 'bytes': target.stat().st_size,
            'sha256': digest(target), 'source_filename': path.name,
            'source_sha256': source_hash, 'source_bytes': path.stat().st_size,
            'source_probe': source_probe, 'derivative_probe': encoded_probe,
            'waveform': peaks, 'full_decode_passed': True}
        old_path.write_text(json.dumps(record, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        print(f'Chapter {number}: {duration:.1f}s, {record["bytes"]/1e6:.1f} MB, full decode passed', flush=True)
        return record

    records = {}
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(process, number, path): number for number, path in sources.items()}
        for future in as_completed(futures):
            result = future.result()
            records[result['n']] = result
    episodes = []
    for n in range(1, 37):
        record = records.get(n)
        entry = {'n': n, 'title': titles[n], 'readPath': f'/writing/debunked-islam/part-1/#chapter-{n}'}
        if record:
            entry.update({key: record[key] for key in ('titlePa', 'src', 'duration', 'bytes', 'waveform')})
            # The author authorised distinct display names for repeated source
            # titles. Retain the original filename in the private audit.
            display_names = {
                13: 'ਛੇ ਦਿਨ ਅਤੇ ਅਰਬਾਂ ਸਾਲ ਪੁਰਾਣਾ ਬ੍ਰਹਿਮੰਡ',
                15: 'ਸੂਰਜ, ਧਰਤੀ ਅਤੇ ਦਿਸਦੇ ਨਜ਼ਾਰਿਆਂ ਦੀ ਭਾਸ਼ਾ',
                23: 'ਕਿਸੇ ਭਵਿੱਖਬਾਣੀ ਨੂੰ ਪ੍ਰਭਾਵਸ਼ਾਲੀ ਕੀ ਬਣਾਉਂਦਾ ਹੈ?',
                24: 'ਇਲਾਜ, ਵਰਤ ਅਤੇ ਅਦਿੱਖ ਕਾਰਨ',
                26: 'ਔਰਤਾਂ, ਅਧਿਕਾਰ ਅਤੇ ਬਰਾਬਰੀ',
                27: 'ਵਿਆਹ, ਬਚਪਨ ਅਤੇ ਸਹਿਮਤੀ',
            }
            if n in display_names:
                entry['titlePa'] = display_names[n]
        else:
            entry.update({'src': None, 'duration': 0, 'titlePa': '', 'waveform': []})
        episodes.append(entry)
    data = {'id':'debunked-islam', 'title':'DEBUNKED: ISLAM', 'language':'pa',
        'languageLabel':'Punjabi', 'format':'Chapter discussions',
        'cover':'/book-covers/debunked-islam.png', 'episodes':episodes}
    (repo/'src/data/podcasts.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')
    missing = [n for n in titles if n not in records]
    inventory = {'verified_at':datetime.now(timezone.utc).isoformat(), 'source_directory':str(source),
        'numbered_recordings':len(records), 'missing_chapters':missing,
        'unassigned_recordings':unnumbered, 'excluded_subfolders':['English Podcast'],
        'derivative_settings':'MP3, 96 kb/s, mono, 44.1 kHz; original sources preserved',
        'total_seconds':sum(r['duration'] for r in records.values()),
        'total_derivative_bytes':sum(r['bytes'] for r in records.values()),
        'records':[records[n] for n in sorted(records)]}
    (report/'inventory.json').write_text(json.dumps(inventory, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({key: inventory[key] for key in ('numbered_recordings','missing_chapters','total_seconds','total_derivative_bytes')}), flush=True)


if __name__ == '__main__':
    main()
