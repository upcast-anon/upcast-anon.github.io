# UPCAST project page

Static project page for *Learning Factorized World Transitions for Geometry-Aware Video World Models*.

Open `index.html` directly or serve the repository with a static file server. The paper PDF is intentionally not included.

The page vendors Lucide 0.468.0 for its interface icons. Its license is in `assets/LUCIDE_LICENSE`.

## Media provenance

`tools/build_media.py` creates web-sized videos and images from the local evaluation outputs. It uses:

- RealEstate10K 64-frame paired clips from `main_v15_paper/combined/long100` for the hero and video explorer.
- Cached ARKitScenes generated RGB and independent depth-estimator outputs for the synchronized frame comparison. Depth images share one display scale across the two methods.
- Paired RealEstate10K 64-frame (100 clips) outputs to compute mean frame-wise PSNR for the interactive curve.
- Paper figures from `/mnt/exdata/iclr2027`.

The physical/appearance diagram illustrates model pathways rather than a spatial attribution of learned latent states. Numerical evaluations and protocols are reported in the paper.

## Refreshing assets

Run in the research environment:

```sh
python tools/build_media.py
```

Browser smoke test (requires Playwright and Chromium):

```sh
python tools/smoke_test.py
```

## Storyboards and themes

`assets/storyboard.js` contains six responsive vector storyboards. Desktop and
mobile use separate fixed layouts; node positions do not move during a reveal.
`assets/presentation.css` supplies the light/dark presentation. Theme preference
follows the system initially and persists after a manual selection.

`python tools/check_storyboards.py` checks text containment, wire/module
intersections, stable canvas sizing, theme persistence and playback timing at
five viewport widths.

## Narrated overview

The film is an original browser-rendered composition with English synthetic
narration (Edge TTS, Aria), synchronized captions, animated vector diagrams,
paper-reported results and existing generated clips. No reference-site media,
voice recording or music is redistributed. RoboCoach and ConfAL-WM informed the
walkthrough, evidence ordering and presentation style; the implementation and
video composition here are original.

Sources: `tools/film_script.json`, `tools/film.html`, `tools/build_film.py`.
Build dependencies: `edge-tts`, `playwright`, `imageio-ffmpeg`, Chromium.

```sh
python tools/build_film.py --preview
python tools/build_film.py
```

The renderer caches narration and segments in `/tmp/upcast-film-build`. Remove
the affected cached segments after changing a scene. After changing narration,
also remove the corresponding voice files and `manifest.json`. Published assets
are `assets/media/upcast-overview.mp4`, its poster, captions and chapter times.
The MP4 is 1920 x 1080 at 24 fps; source generation clips retain their original
256 x 256 resolution and 8 fps. Code/checkpoint/evaluation release entries are
explicitly pending, not links to unpublished repositories.
