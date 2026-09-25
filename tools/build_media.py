#!/usr/bin/env python3
"""Build small, reproducible web assets from the paper evaluation outputs."""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "assets" / "media"
DATA = ROOT / "assets" / "data"
BASE = Path("/mnt/exdata/GeometryForcing/output/evaluations/main_v15_paper")
ARKIT = Path("/mnt/exdata/GeometryForcing/output/evaluations/arkitscenes-100")
CACHE = Path("/mnt/exdata/GeometryForcing/metric_cache/arkitscenes-100/depth/depth-anything_Depth-Anything-V2-Metric-Indoor-Small-hf")
PAPER = Path("/mnt/exdata/iclr2027")
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def rgb_frames(arr: np.ndarray) -> np.ndarray:
    return np.ascontiguousarray(arr.transpose(0, 2, 3, 1))


def encode(frames: np.ndarray, path: Path, fps: int = 8, crf: int = 23) -> None:
    height, width = frames.shape[1:3]
    command = [
        FFMPEG, "-hide_banner", "-loglevel", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{width}x{height}",
        "-r", str(fps), "-i", "-", "-an", "-vcodec", "libx264",
        "-preset", "medium", "-crf", str(crf), "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(path),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        process.stdin.write(frames.tobytes())
        process.stdin.close()
        if process.wait() != 0:
            raise RuntimeError(f"ffmpeg failed: {path}")
    finally:
        if process.poll() is None:
            process.kill()


def save_frame(frame: np.ndarray, path: Path, width: int = 768) -> None:
    image = Image.fromarray(frame)
    if image.width != width:
        image = image.resize((width, round(width * image.height / image.width)), Image.Resampling.LANCZOS)
    image.save(path, quality=88, optimize=True)


def load_pair(folder: Path, index: int) -> tuple[np.ndarray, np.ndarray]:
    with np.load(folder / f"video_{index:05d}.npz") as archive:
        return rgb_frames(archive["gt"]), rgb_frames(archive["gen"])


def psnr_curve(folder: Path, count: int) -> list[float]:
    result = []
    for index in range(count):
        gt, generated = load_pair(folder, index)
        diff = gt.astype(np.float32) - generated.astype(np.float32)
        mse = np.mean(diff * diff, axis=(1, 2, 3))
        result.append(mse)
    cohort_mse = np.mean(result, axis=0)
    return (10 * np.log10(255 * 255 / np.maximum(cohort_mse, 1e-8))).round(3).tolist()


def stress_files(method: str) -> list[Path]:
    folders = list((BASE / "generation" / "stress12" / method).glob("chunk_*_2/raw/*/data.npz"))
    return sorted(folders, key=lambda p: (int(p.parts[-4].split("_")[1]), int(p.parts[-2])))


def stress_curve(method: str) -> list[float]:
    result = []
    files = stress_files(method)
    assert len(files) == 12, (method, len(files))
    for path in files:
        with np.load(path) as archive:
            gt, generated = rgb_frames(archive["gt"]), rgb_frames(archive["gen"])
        diff = gt.astype(np.float32) - generated.astype(np.float32)
        mse = np.mean(diff * diff, axis=(1, 2, 3))
        result.append(mse)
    cohort_mse = np.mean(result, axis=0)
    return (10 * np.log10(255 * 255 / np.maximum(cohort_mse, 1e-8))).round(3).tolist()


def depth_frames(array: np.ndarray, near: float, far: float) -> np.ndarray:
    # One fixed normalization per clip preserves changes through the rollout.
    normalized = np.clip((array.astype(np.float32) - near) / (far - near), 0, 1)
    stops = np.array([[15, 35, 57], [22, 112, 126], [79, 180, 146], [237, 216, 117], [251, 244, 211]], dtype=np.float32)
    positions = normalized * (len(stops) - 1)
    lower = np.floor(positions).astype(np.int32)
    upper = np.minimum(lower + 1, len(stops) - 1)
    color = stops[lower] * (1 - (positions - lower))[..., None] + stops[upper] * (positions - lower)[..., None]
    color[~np.isfinite(array) | (array <= 0)] = [12, 20, 31]
    return np.ascontiguousarray(color.astype(np.uint8))


def main() -> None:
    MEDIA.mkdir(parents=True, exist_ok=True)
    DATA.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(PAPER / "figures" / "intro_overview.svg", MEDIA / "intro_overview.svg")
    shutil.copyfile(PAPER / "figures" / "method_overview.svg", MEDIA / "method_overview.svg")
    long_root = BASE / "combined" / "long100"
    scenes = {7: "living", 8: "kitchen", 16: "aerial"}
    hero_parts = []
    for index, slug in scenes.items():
        gt, ours = load_pair(long_root / "Ours" / "raw", index)
        _, gf = load_pair(long_root / "GF" / "raw", index)
        for label, frames in (("upcast", ours), ("geometry-forcing", gf), ("reference", gt)):
            encode(frames, MEDIA / f"{slug}-{label}.mp4")
            save_frame(frames[40], MEDIA / f"{slug}-{label}.jpg")
        hero_parts.append(ours)
        print("scene", slug, flush=True)
    hero = np.concatenate(hero_parts, axis=2)
    encode(hero, MEDIA / "hero.mp4", crf=24)
    save_frame(hero[32], MEDIA / "hero.jpg", width=1536)

    # A complete camera-conditioned rollout for the long-horizon viewer.
    horizon_files = {
        "upcast": BASE / "generation/stress100/Ours/chunk_44_2/raw/1/data.npz",
    }
    for label, path in horizon_files.items():
        with np.load(path) as archive:
            frames = rgb_frames(archive["gen"])
        encode(frames, MEDIA / f"horizon-{label}.mp4", crf=24)
        for point in (1, 64, 128, 192, 255):
            save_frame(frames[point], MEDIA / f"horizon-{label}-{point:03d}.jpg", width=512)
        print("horizon", label, flush=True)

    # Depth is the cached independent estimator output, not a decoded UPCAST state.
    arkit_index = 25
    _, ours = load_pair(ARKIT / "combined" / "Ours" / "raw", arkit_index)
    _, gf = load_pair(ARKIT / "combined" / "GF" / "raw", arkit_index)
    geometry_sources = (("upcast", ours, "Ours"), ("geometry-forcing", gf, "GF"))
    depths = {}
    for label, _, source in geometry_sources:
        depth_file = next((CACHE / source).glob(f"video_{arkit_index:05d}_*.npz"))
        with np.load(depth_file) as archive:
            depths[label] = archive["depth"].astype(np.float32)
    valid = np.concatenate([array[np.isfinite(array) & (array > 0)] for array in depths.values()])
    near, far = np.percentile(valid, [3, 97])
    for label, frames, _ in geometry_sources:
        encode(frames, MEDIA / f"geometry-{label}-rgb.mp4")
        save_frame(frames[40], MEDIA / f"geometry-{label}-rgb.jpg")
        depth = depth_frames(depths[label], near, far)
        encode(depth, MEDIA / f"geometry-{label}-depth.mp4")
        save_frame(depth[40], MEDIA / f"geometry-{label}-depth.jpg")
        print("geometry", label, flush=True)

    curves = {
        "short": {"frames": 64, "count": 100, "upcast": psnr_curve(long_root / "Ours" / "raw", 100), "geometryForcing": psnr_curve(long_root / "GF" / "raw", 100)},
        "long": {"frames": 256, "count": 12, "upcast": stress_curve("Ours"), "geometryForcing": stress_curve("GF")},
    }
    (DATA / "curves.js").write_text("window.UPCAST_CURVES=" + json.dumps(curves, separators=(",", ":")) + ";\n")
    print("curves", flush=True)



if __name__ == "__main__":
    main()
