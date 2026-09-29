#!/usr/bin/env python3
"""Build small, reproducible web assets from the paper evaluation outputs."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "assets" / "media"
DATA = ROOT / "assets" / "data"
BASE = Path("/mnt/exdata/GeometryForcing/output/evaluations/main_v15_paper")
ARKIT_PILOT = Path("/mnt/exdata/GeometryForcing/output/evaluations/arkitscenes-pilot")
PILOT_CACHE = Path("/mnt/exdata/GeometryForcing/metric_cache/arkitscenes-pilot/depth/depth-anything_Depth-Anything-V2-Metric-Indoor-Small-hf")
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


def depth_frames(array: np.ndarray, near: float, far: float) -> np.ndarray:
    # A shared range and palette keep both methods directly comparable.
    normalized = np.clip((far - array.astype(np.float32)) / (far - near), 0, 1)
    stops = np.array([[20, 42, 56], [35, 87, 108], [78, 145, 148], [171, 197, 148], [247, 225, 153]], dtype=np.float32)
    positions = normalized * (len(stops) - 1)
    lower = np.floor(positions).astype(np.int32)
    upper = np.minimum(lower + 1, len(stops) - 1)
    color = stops[lower] * (1 - (positions - lower))[..., None] + stops[upper] * (positions - lower)[..., None]
    color[~np.isfinite(array) | (array <= 0)] = [12, 20, 31]
    return np.ascontiguousarray(color.astype(np.uint8))


def error_frames(prediction: np.ndarray, reference: np.ndarray, valid: np.ndarray) -> np.ndarray:
    relative = np.abs(prediction - reference) / np.maximum(reference, 0.1)
    normalized = np.clip(relative / 0.5, 0, 1)
    stops = np.array([[235, 247, 244], [116, 191, 174], [249, 204, 109], [211, 83, 72]], dtype=np.float32)
    position = normalized * (len(stops) - 1)
    lower = np.floor(position).astype(np.int32)
    upper = np.minimum(lower + 1, len(stops) - 1)
    color = stops[lower] * (1 - (position - lower))[..., None] + stops[upper] * (position - lower)[..., None]
    color[~valid] = [35, 48, 53]
    return np.ascontiguousarray(color.astype(np.uint8))


def render_paper_figures() -> None:
    for name in ("intro_overview", "method_overview"):
        subprocess.run(
            ["pdftoppm", "-f", "1", "-l", "1", "-singlefile", "-r", "144", "-png",
             str(PAPER / "figures" / f"{name}.pdf"), str(MEDIA / name)],
            check=True,
        )
    with Image.open(MEDIA / "intro_overview.png") as image:
        for label, left, right in (("alignment", 0, 460), ("factorized", 460, 1001), ("generation", 1001, 1440)):
            x0 = round(image.width * left / 1440)
            x1 = round(image.width * right / 1440)
            image.crop((x0, 0, x1, image.height)).save(MEDIA / f"intro-{label}.png", optimize=True)


def main() -> None:
    MEDIA.mkdir(parents=True, exist_ok=True)
    DATA.mkdir(parents=True, exist_ok=True)
    render_paper_figures()
    long_root = BASE / "combined" / "long100"
    scenes = {0: "bathroom", 80: "stairwell", 90: "entryway"}
    for index, slug in scenes.items():
        gt, ours = load_pair(long_root / "Ours" / "raw", index)
        _, gf = load_pair(long_root / "GF" / "raw", index)
        for label, frames in (("upcast", ours), ("geometry-forcing", gf), ("reference", gt)):
            encode(frames, MEDIA / f"{slug}-{label}.mp4")
            save_frame(frames[0], MEDIA / f"{slug}-{label}.jpg")
        if slug == "stairwell":
            encode(ours, MEDIA / "hero.mp4", crf=22)
            save_frame(ours[0], MEDIA / "hero.jpg", width=1536)
            save_frame(gt[1], MEDIA / "method-frame-i.jpg", width=512)
            save_frame(gt[40], MEDIA / "method-frame-j.jpg", width=512)
            for point in (1, 15, 31, 47, 63):
                save_frame(ours[point], MEDIA / f"timeline-{point + 1:02d}.jpg", width=512)
        print("scene", slug, flush=True)

    # Static, synchronized samples avoid distracting temporal estimator flicker.
    manifest = json.loads((Path('/mnt/exdata/GeometryForcing/data/arkitscenes-pilot/pilot_manifest.json')).read_text())
    report = json.loads((ARKIT_PILOT / 'geometry/metric_depth/metric_depth_report.json').read_text())
    by_clip = {(row['index'], row['source']): row for row in report['per_clip']}
    points = (1, 8, 16, 24, 32, 40, 48, 56, 63)
    scene_metrics = {}
    for arkit_index, slug in ((0, 'poster'), (7, 'hallway')):
        gt, ours = load_pair(ARKIT_PILOT / 'combined/Ours/raw', arkit_index)
        _, gf = load_pair(ARKIT_PILOT / 'combined/GF/raw', arkit_index)
        clip_id = manifest['clips'][arkit_index]['clip_id']
        with np.load(Path('/mnt/exdata/GeometryForcing/data/arkitscenes-pilot/test') / f'{clip_id}.npz') as archive:
            sensor = archive['depth_m'].astype(np.float32)
            sensor_valid = archive['depth_valid'].astype(bool) & np.isfinite(sensor) & (sensor > 0)
        geometry_sources = (("upcast", ours, "Ours"), ("geometry-forcing", gf, "GF"))
        depths = {}
        for label, _, source in geometry_sources:
            depth_file = next((PILOT_CACHE / source).glob(f'video_{arkit_index:05d}_*.npz'))
            with np.load(depth_file) as archive:
                depths[label] = archive['depth'].astype(np.float32) * by_clip[arkit_index, source]['clip_scale']
        all_valid = np.concatenate([sensor[sensor_valid], *(array[np.isfinite(array) & (array > 0)] for array in depths.values())])
        near, far = np.percentile(all_valid, [2, 98])
        scene_metrics[slug] = {
            label: {'absRel': round(by_clip[arkit_index, source]['aligned_abs_rel'], 3),
                    'fscore': round(by_clip[arkit_index, source]['point_fscore_10cm'], 3),
                    'chamfer': round(by_clip[arkit_index, source]['point_chamfer_l1_m'], 3)}
            for label, _, source in geometry_sources
        }
        for label, frames, _ in geometry_sources:
            colored_depth = depth_frames(depths[label], near, far)
            colored_error = error_frames(depths[label], sensor, sensor_valid)
            for point in points:
                stem = f'geometry-{slug}-{label}'
                save_frame(frames[point], MEDIA / f'{stem}-rgb-{point + 1:02d}.jpg', width=512)
                save_frame(colored_depth[point], MEDIA / f'{stem}-depth-{point + 1:02d}.jpg', width=512)
                save_frame(colored_error[point], MEDIA / f'{stem}-error-{point + 1:02d}.jpg', width=512)
        sensor_color = depth_frames(sensor, near, far)
        for point in points:
            save_frame(gt[point], MEDIA / f'geometry-{slug}-reference-rgb-{point + 1:02d}.jpg', width=512)
            save_frame(sensor_color[point], MEDIA / f'geometry-{slug}-reference-depth-{point + 1:02d}.jpg', width=512)
        print('geometry', slug, flush=True)

    (DATA / 'geometry.js').write_text('window.UPCAST_GEOMETRY=' + json.dumps(scene_metrics, separators=(',', ':')) + ';\n')

    curves = {
        "short": {"frames": 64, "count": 100, "upcast": psnr_curve(long_root / "Ours" / "raw", 100), "geometryForcing": psnr_curve(long_root / "GF" / "raw", 100)},
    }
    (DATA / "curves.js").write_text("window.UPCAST_CURVES=" + json.dumps(curves, separators=(",", ":")) + ";\n")
    print("curves", flush=True)



if __name__ == "__main__":
    main()
