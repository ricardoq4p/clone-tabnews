const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");

const root = path.join(__dirname, "../public/audio/misericordia");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifest.json"), "utf8"),
);
const contentSource = fs.readFileSync(
  path.join(__dirname, "../lib/misericordia/content.js"),
  "utf8",
);

const expectedFiles = [
  ["sinal", "01-sinal-da-cruz.mp3"],
  ["pai", "02-pai-nosso.mp3"],
  ["ave", "03-ave-maria.mp3"],
  ["credo", "04-credo.mp3"],
  ["eterno-pai", "05-eterno-pai.mp3"],
  ["dolorosa-paixao", "06-pela-sua-dolorosa-paixao.mp3"],
  ["deus-santo", "07-deus-santo.mp3"],
  ["oracao-conclusiva", "08-oracao-conclusiva.mp3"],
];

assert.equal(manifest.status, "ready", "Manifest status must be ready");

for (const [id, expectedFile] of expectedFiles) {
  const clip = manifest.clips[id];
  assert.ok(clip, `Missing clip: ${id}`);
  assert.equal(clip.file, expectedFile, `Unexpected filename for ${id}`);
  assert.equal(clip.recorded, true, `${id}: recorded must be true`);
  assert.ok(clip.text && clip.text.length > 10, `${id}: missing text`);
  assert.ok(
    contentSource.includes(clip.text),
    `${id}: manifest text must match lib/misericordia/content.js`,
  );
  const filePath = path.join(root, clip.file);
  assert.ok(fs.existsSync(filePath), `Missing audio file: ${clip.file}`);
  const buffer = fs.readFileSync(filePath);
  assert.ok(buffer.length > 1024, `${clip.file}: file too small`);
  assert.equal(
    crypto.createHash("sha256").update(buffer).digest("hex"),
    clip.sha256,
    `${id}: sha256 mismatch`,
  );
  assert.ok(
    clip.duration > clip.narrationEnd && clip.narrationEnd > 0,
    `${id}: invalid duration/narrationEnd`,
  );
  assert.ok(clip.pauseSeconds >= 2, `${id}: pauseSeconds must be >= 2`);
  console.log(
    `  [OK] ${clip.file} (${buffer.length} bytes, duration=${clip.duration}s, narrationEnd=${clip.narrationEnd}s, pause=${clip.pauseSeconds}s)`,
  );
}

console.log(
  `Validated ${expectedFiles.length} Mercy Chaplet clips, file hashes, texts, and silence metadata.`,
);
