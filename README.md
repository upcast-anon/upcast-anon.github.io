# UPCAST project page

Static project page for *Learning Factorized World Transitions for Geometry-Aware Video World Models*.

Open `index.html` directly or serve the repository with a static file server. The paper PDF is intentionally not included.

The page vendors Lucide 0.468.0 for its interface icons. Its license is in `assets/LUCIDE_LICENSE`.

## Media provenance

`tools/build_media.py` creates web-sized videos and images from the local evaluation outputs. It uses:

- RealEstate10K 64-frame paired clips from `main_v15_paper/combined/long100` for the hero and video explorer.
- A 256-frame RealEstate10K rollout from `main_v15_paper/generation/stress100` for the long-horizon viewer.
- Cached ARKitScenes generated RGB and independent depth-estimator outputs for the geometry viewer.
- Paired RealEstate10K 64-frame (100 clips) and 256-frame (12 clips) outputs to compute mean frame-wise PSNR for the interactive curve.
- Paper figures from `/mnt/exdata/iclr2027`.

The physical/appearance split view is an image-space illustration, not a direct decoding or spatial attribution of learned latent states. Numerical evaluations and protocols are reported in the paper.

## Refreshing assets

Run in the research environment:

```sh
python tools/build_media.py
```

Browser smoke test (requires Playwright and Chromium):

```sh
python tools/smoke_test.py
```
