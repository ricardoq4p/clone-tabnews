"""Local generation tooling for the Terço da Divina Misericórdia audio package.

Uses the same Kokoro ONNX runtime, pm_santa voice, speed (0.88), and silence
structure as scripts/generate-rosary-demo.py. Never used by the app runtime or build.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re

import numpy as np
import soundfile as sf
import onnxruntime as ort
from kokoro_onnx import Kokoro

parser = argparse.ArgumentParser()
parser.add_argument("model_dir", type=Path)
parser.add_argument("--voice", default="pm_santa")
args = parser.parse_args()

root = Path(__file__).resolve().parent.parent
output = root / "public/audio/misericordia"
output.mkdir(parents=True, exist_ok=True)
manifest_path = output / "manifest.json"
existing = json.loads(manifest_path.read_text(encoding="utf-8"))

options = ort.SessionOptions()
options.intra_op_num_threads = 2
options.inter_op_num_threads = 1
session = ort.InferenceSession(
    str(args.model_dir / "kokoro-v1.0.onnx"),
    sess_options=options,
    providers=["CPUExecutionProvider"],
)
kokoro = Kokoro.from_session(session, str(args.model_dir / "voices-v1.0.bin"))

package_id = existing.get("packageId") or "panteralab-misericordia-v1"
voice_label = existing.get("voice") or "Kokoro · Santa · português brasileiro"

manifest = {
    "packageId": package_id,
    "title": existing.get("title") or "Terço da Divina Misericórdia",
    "voice": voice_label,
    "status": "generating",
    "directory": existing.get("directory") or "/audio/misericordia",
    "clips": {},
}

source_keys = ("order", "file", "title", "text", "pauseSeconds", "optional")

for clip_id, clip in existing["clips"].items():
    path = output / clip["file"]
    source_meta = {k: clip[k] for k in source_keys if k in clip}
    if (
        path.exists()
        and existing.get("packageId") == package_id
        and clip.get("recorded") is True
        and clip.get("narrationEnd", 0) > 0
        and clip.get("duration", 0) > clip.get("narrationEnd", 0)
        and clip.get("sha256") == hashlib.sha256(path.read_bytes()).hexdigest()
    ):
        manifest["clips"][clip_id] = clip
        print(f"Verified existing {clip_id} ({clip['file']}): {clip['duration']:.1f}s", flush=True)
        continue

    parts = re.split(r"(?<=[.!?;])\s+", clip["text"])
    audio = []
    rate = 24000
    for sentence in parts:
        samples, rate = kokoro.create(sentence, voice=args.voice, speed=0.88, lang="pt-br")
        audio.extend([samples, np.zeros(int(rate * 0.35), dtype=np.float32)])
    spoken = np.concatenate(audio)
    samples = np.concatenate([spoken, np.zeros(int(rate * clip["pauseSeconds"]), dtype=np.float32)])
    sf.write(str(path), samples, rate, format="MP3", bitrate_mode="CONSTANT")

    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    narration_end = round(len(spoken) / rate, 3)
    duration = round(len(samples) / rate, 3)

    manifest["clips"][clip_id] = {
        **source_meta,
        "narrationEnd": narration_end,
        "duration": duration,
        "sha256": digest,
        "recorded": True,
    }
    print(f"Generated {clip_id} ({clip['file']}): {duration:.1f}s", flush=True)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

all_recorded = len(manifest["clips"]) == 8 and all(
    c.get("recorded") is True and (output / c["file"]).exists()
    for c in manifest["clips"].values()
)
manifest["status"] = "ready" if all_recorded else "pending-recordings"
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
