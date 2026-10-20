import manifest from "../../public/audio/rosario/demo/manifest.json";

export const AUDIO_RATES = [1, 1.25, 1.5, 2];
export const audioDemoEnabled =
  process.env.NEXT_PUBLIC_ROSARY_AUDIO_DEMO !== "false";

// Match exact spoken text, not just a prayer name or an editable edition ID.
export function narrationForStep(step) {
  if (!step) return "";
  return step.prayer === "contemplacao"
    ? `${step.title}. ${step.text}`
    : step.text;
}

export function resolveAudio(step) {
  if (!step) return null;
  const id = step.prayer === "contemplacao" ? step.mystery.id : step.prayer;
  const clip = manifest.clips[id];
  if (!clip || clip.text !== narrationForStep(step)) return null;
  return {
    ...clip,
    id: `${manifest.packageId}:${id}:${clip.sha256}`,
    src: `/audio/rosario/demo/${clip.file}`,
  };
}
