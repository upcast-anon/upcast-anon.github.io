#!/usr/bin/env python3
"""Render the narrated overview from a deterministic browser timeline.

Requires edge-tts, playwright and imageio-ffmpeg. Sources stay local; only the
finished MP4, captions, chapter times and poster are published in assets/media.
"""
import argparse
import asyncio
import json
import math
import os
import re
import subprocess
import tempfile
import wave
from pathlib import Path

import edge_tts
import imageio_ffmpeg
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path('/tmp/upcast-film-build')
OUT = ROOT / 'assets/media'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 24


def run(*args):
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error', *map(str, args)], check=True)


def stamp(seconds):
    ms = round(seconds * 1000)
    return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02}.{ms % 1000:03}'


def finish_captions(chapters):
    vtt, events = [], []
    for index, chapter in enumerate(chapters):
        words = json.loads((CACHE / f'voice-{index}.json').read_text())
        cursor = 0
        for word in words:
            found = re.search(re.escape(word['text']), chapter['narration'][cursor:], re.IGNORECASE)
            if found:
                cursor += found.end()
                punctuation = re.match(r'[.,;:!?]+', chapter['narration'][cursor:])
                if punctuation:
                    word['text'] += punctuation.group()
                    cursor += len(punctuation.group())
        cues, group = [], []
        for word in words:
            group.append(word)
            phrase = ' '.join(w['text'] for w in group)
            if len(phrase) > 76 or word['text'].endswith(('.', '?', '!')):
                cues.append({'start': group[0]['start'] + .5, 'end': word['end'] + .7, 'text': phrase})
                group = []
        if group:
            cues.append({'start': group[0]['start'] + .5, 'end': group[-1]['end'] + .7, 'text': ' '.join(w['text'] for w in group)})
        for n, cue in enumerate(cues):
            if n + 1 < len(cues):
                cue['end'] = min(cue['end'], cues[n + 1]['start'])
            start, end = chapter['start'] + cue['start'], chapter['start'] + cue['end']
            vtt.append(f"{stamp(start)} --> {stamp(end)}\n{cue['text']}\n")
            ass_time = lambda t: stamp(t)[1:-1]
            events.append(f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Default,,0,0,0,,{cue['text']}")
        chapter['cues'] = cues
    (OUT / 'overview-en.vtt').write_text('WEBVTT\n\n' + '\n'.join(vtt))
    (CACHE / 'captions.ass').write_text('''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,30,&H00F5F3EE,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,135,135,57,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
''' + '\n'.join(events))


async def narration():
    script = json.loads((ROOT / 'tools/film_script.json').read_text())
    chapters, captions, audio_files = [], [], []
    elapsed = 0
    for i, scene in enumerate(script):
        voice = CACHE / f'voice-{i}.mp3'
        metadata = CACHE / f'voice-{i}.json'
        if not voice.exists() or not metadata.exists():
            for attempt in range(3):
                words = []
                communicate = edge_tts.Communicate(scene['narration'], 'en-US-AriaNeural', rate='-3%', boundary='WordBoundary', connect_timeout=45)
                try:
                    with voice.open('wb') as output:
                        async for item in communicate.stream():
                            if item['type'] == 'audio':
                                output.write(item['data'])
                            elif item['type'] == 'WordBoundary':
                                words.append({'text': item['text'], 'start': item['offset'] / 1e7, 'end': (item['offset'] + item['duration']) / 1e7})
                    break
                except Exception:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(2)
            metadata.write_text(json.dumps(words))
        words = json.loads(metadata.read_text())
        raw = CACHE / f'raw-{i}.wav'
        run('-i', voice, '-ar', 48000, '-ac', 1, raw)
        with wave.open(str(raw)) as audio:
            length = audio.getnframes() / audio.getframerate()
        duration = math.ceil((length + 1.25) * FPS) / FPS
        padded = CACHE / f'padded-{i}.wav'
        run('-i', raw, '-af', 'adelay=500,apad', '-t', duration, padded)
        audio_files.append(padded)
        cues, group = [], []
        for word in words:
            group.append(word)
            phrase = ' '.join(w['text'] for w in group)
            if len(phrase) > 76 or word['text'].endswith(('.', '?', '!')):
                cues.append({'start': group[0]['start'] + .5, 'end': word['end'] + .7, 'text': phrase})
                group = []
        if group:
            cues.append({'start': group[0]['start'] + .5, 'end': group[-1]['end'] + .7, 'text': ' '.join(w['text'] for w in group)})
        for cue in cues:
            captions.append(f"{stamp(elapsed + cue['start'])} --> {stamp(elapsed + cue['end'])}\n{cue['text']}\n")
        chapters.append({**scene, 'start': elapsed, 'duration': duration, 'cues': cues})
        elapsed += duration
        print(f"Narration {i + 1}/{len(script)}: {duration:.1f}s", flush=True)
    listing = CACHE / 'audio-list.txt'
    listing.write_text('\n'.join(f"file '{p}'" for p in audio_files))
    run('-f', 'concat', '-safe', 0, '-i', listing, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=9', CACHE / 'narration.wav')
    (CACHE / 'manifest.json').write_text(json.dumps(chapters))
    (OUT / 'overview-en.vtt').write_text('WEBVTT\n\n' + '\n'.join(captions))
    (OUT / 'overview-chapters.json').write_text(json.dumps([{'title': c['title'], 'start': c['start']} for c in chapters], indent=2) + '\n')


def render(preview=False):
    chapters = json.loads((CACHE / 'manifest.json').read_text())
    finish_captions(chapters)
    (ROOT / 'assets/data/film-chapters.js').write_text('window.UPCAST_FILM_CHAPTERS = ' + json.dumps([{'title': c['title'], 'start': c['start']} for c in chapters]) + ';\n')
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'), args=['--no-sandbox', '--allow-file-access-from-files'])
        page = browser.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=1.5)
        page.goto((ROOT / 'tools/film.html').as_uri(), wait_until='load')
        page.evaluate('document.fonts.ready')
        for i, chapter in enumerate(chapters):
            page.evaluate('args => loadScene(...args)', [chapter, i, len(chapters)])
            page.wait_for_function('window.sceneReady === true')
            total = round(chapter['duration'] * FPS)
            if preview:
                page.evaluate('args => renderFrame(...args)', [min(8, chapter['duration'] / 2), chapter['duration'], ''])
                page.screenshot(path=str(CACHE / f'preview-{i}.jpg'), type='jpeg', quality=95)
                print(f'Preview {i}', flush=True)
                continue
            segment = CACHE / f'scene-{i}.mp4'
            if segment.exists():
                print(f'Cached scene {i + 1}', flush=True)
                continue
            command = [FFMPEG, '-y', '-loglevel', 'error', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-r', str(FPS), '-i', '-', '-an', '-c:v', 'libx264', '-threads', '4', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(segment)]
            encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
            try:
                for frame in range(total):
                    t = frame / FPS
                    caption = next((c['text'] for c in chapter['cues'] if c['start'] <= t < c['end']), '')
                    page.evaluate('args => renderFrame(...args)', [t, chapter['duration'], caption])
                    encoder.stdin.write(page.screenshot(type='jpeg', quality=94))
                    if frame % (FPS * 5) == 0:
                        print(f'Scene {i + 1}/{len(chapters)}: {t:.0f}/{chapter["duration"]:.0f}s', flush=True)
            finally:
                encoder.stdin.close()
                if encoder.wait() != 0:
                    segment.unlink(missing_ok=True)
                    raise RuntimeError('Video encoding failed')
        browser.close()
    if not preview:
        listing = CACHE / 'video-list.txt'
        listing.write_text('\n'.join(f"file '{CACHE / f'scene-{i}.mp4'}'" for i in range(len(chapters))))
        run('-f', 'concat', '-safe', 0, '-i', listing, '-i', CACHE / 'narration.wav', '-vf', f'drawbox=x=0:y=922:w=iw:h=153:color=0x15191d:t=fill,ass={CACHE / "captions.ass"}', '-c:v', 'libx264', '-threads', '4', '-preset', 'fast', '-crf', '18', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-b:a', '160k', '-movflags', '+faststart', '-shortest', OUT / 'upcast-overview.mp4')
        run('-ss', 3, '-i', OUT / 'upcast-overview.mp4', '-frames:v', 1, '-q:v', 2, OUT / 'overview-poster.jpg')
        print(f'Complete: {sum(c["duration"] for c in chapters):.1f}s', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--voice-only', action='store_true')
    parser.add_argument('--preview', action='store_true')
    args = parser.parse_args()
    CACHE.mkdir(exist_ok=True)
    if not (CACHE / 'manifest.json').exists():
        asyncio.run(narration())
    if not args.voice_only:
        render(args.preview)
