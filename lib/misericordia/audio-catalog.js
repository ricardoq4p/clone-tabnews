import manifest from "../../public/audio/misericordia/manifest.json";
import { buildMercyChaplet } from "./engine";

export const MERCY_AUDIO_RATES = [1, 1.25, 1.5, 2];
export const MERCY_AUDIO_MANIFEST = manifest;

export function narrationForMercyStep(step) {
  if (!step || typeof step.text !== "string") return "";
  return step.text;
}

export function resolveMercyAudio(step, customManifest = MERCY_AUDIO_MANIFEST) {
  if (!step || !customManifest?.clips) return null;
  const clip = customManifest.clips[step.prayer];
  if (!clip || clip.text !== narrationForMercyStep(step)) return null;
  const baseDir = customManifest.directory || "/audio/misericordia";
  return {
    ...clip,
    key: step.prayer,
    id: `${customManifest.packageId}:${step.prayer}:${clip.sha256 || clip.file}`,
    src: `${baseDir}/${clip.file}`,
  };
}

export function areMercyRecordingsIntegrated(
  customManifest = MERCY_AUDIO_MANIFEST,
) {
  if (!customManifest?.clips) return false;
  const entries = Object.values(customManifest.clips);
  return (
    entries.length > 0 && entries.every((entry) => entry.recorded === true)
  );
}

export function buildMercyAudioSequence(
  options = { closingPrayer: true },
  customManifest = MERCY_AUDIO_MANIFEST,
) {
  const steps = buildMercyChaplet(options);
  return steps.map((step, index) => {
    const clip = resolveMercyAudio(step, customManifest);
    return {
      stepNumber: index + 1,
      stepId: step.id,
      prayer: step.prayer,
      title: step.title,
      stageTitle: step.stageTitle,
      optional: Boolean(step.optional),
      file: clip?.file || null,
      src: clip?.src || null,
      recorded: Boolean(clip?.recorded),
    };
  });
}
