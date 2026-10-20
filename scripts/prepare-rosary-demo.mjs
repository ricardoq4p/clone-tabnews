// Exports only approved, public devotional text. No API or database access.
import fs from "node:fs";
import { PRAYERS, MYSTERY_SETS } from "../lib/rosary/content-v2026-1.js";
const mystery = MYSTERY_SETS[0].mysteries[0];
const clips = Object.fromEntries(
  Object.entries(PRAYERS).map(([id, prayer]) => [
    id,
    { text: prayer.text, pauseSeconds: 2.2, file: `${id}.mp3` },
  ]),
);
clips[mystery.id] = {
  text: `${mystery.title}. ${mystery.meditation}`,
  pauseSeconds: 8,
  file: `${mystery.id}.mp3`,
};
fs.mkdirSync(".qa/audio", { recursive: true });
fs.writeFileSync(
  ".qa/audio/transcripts.json",
  JSON.stringify({ packageId: "kokoro-pm-santa-demo-1", clips }, null, 2),
);
console.log(
  `Prepared ${Object.keys(clips).length} public narration transcripts.`,
);
