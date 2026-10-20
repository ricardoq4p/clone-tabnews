"""Local, optional generation tooling. Never used by the app or the build.

Install kokoro-onnx and soundfile in an isolated environment, then supply the
model directory. Models are downloaded separately from the documented source.
Only the public texts exported by prepare-rosary-demo.mjs are processed.
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
source = json.loads((root / ".qa/audio/transcripts.json").read_text(encoding="utf-8"))
output = root / "public/audio/rosario/demo"
output.mkdir(parents=True, exist_ok=True)
manifest_path = output / "manifest.json"
existing = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
options = ort.SessionOptions()
options.intra_op_num_threads = 2
options.inter_op_num_threads = 1
session = ort.InferenceSession(str(args.model_dir / "kokoro-v1.0.onnx"), sess_options=options, providers=["CPUExecutionProvider"])
kokoro = Kokoro.from_session(session, str(args.model_dir / "voices-v1.0.bin"))
package_id = f"kokoro-{args.voice}-demo-1"
manifest = {"packageId": package_id, "voice": f"Kokoro · {args.voice} · português brasileiro", "clips": {}}
for clip_id, clip in source["clips"].items():
    path = output / clip["file"]
    previous = existing.get("clips", {}).get(clip_id, {})
    if (path.exists() and existing.get("packageId") == package_id
        and all(previous.get(key) == value for key, value in clip.items())
        and previous.get("sha256") == hashlib.sha256(path.read_bytes()).hexdigest()):
        manifest["clips"][clip_id] = previous
        continue
    # Sentence-sized generation gives breathing space without rewriting prayers.
    parts = re.split(r"(?<=[.!?;])\s+", clip["text"])
    audio = []
    for sentence in parts:
        samples, rate = kokoro.create(sentence, voice=args.voice, speed=0.88, lang="pt-br")
        audio.extend([samples, np.zeros(int(rate * 0.35), dtype=np.float32)])
    spoken = np.concatenate(audio)
    samples = np.concatenate([spoken, np.zeros(int(rate * clip["pauseSeconds"]), dtype=np.float32)])
    sf.write(str(path), samples, rate, format="MP3", bitrate_mode="CONSTANT")
    manifest["clips"][clip_id] = {
        **clip,
        "narrationEnd": round(len(spoken) / rate, 3),
        "duration": round(len(samples) / rate, 3),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }
    print(f"Generated {clip_id}: {len(samples) / rate:.1f}s", flush=True)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
