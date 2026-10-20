const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const root = path.join(__dirname, "../public/audio/rosario/demo");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json")));
const required = [
  "sinal",
  "oferecimento",
  "credo",
  "pai",
  "ave",
  "gloria",
  "fatima",
  "agradecimento",
  "salve",
  "final",
  "anunciacao",
];
for (const id of required) {
  const clip = manifest.clips[id];
  assert.ok(clip, `Missing clip: ${id}`);
  assert.ok(clip.text && clip.file && path.basename(clip.file) === clip.file);
  const buffer = fs.readFileSync(path.join(root, clip.file));
  assert.equal(
    crypto.createHash("sha256").update(buffer).digest("hex"),
    clip.sha256,
    `${id}: changed audio`,
  );
  assert.ok(clip.duration > clip.narrationEnd && clip.narrationEnd > 0);
  assert.ok(clip.pauseSeconds >= (id === "anunciacao" ? 8 : 2));
}
console.log(
  `Validated ${required.length} clips, file hashes and silence metadata.`,
);
