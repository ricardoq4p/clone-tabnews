export function checkpointKey(scope) {
  return `panteralab.rosary.audio.v1.${scope}`;
}

export function readCheckpoint(storage, scope, stepId, clipId) {
  try {
    const value = JSON.parse(storage.getItem(checkpointKey(scope)));
    if (
      value?.stepId !== stepId ||
      value?.clipId !== clipId ||
      !Number.isFinite(value.time) ||
      value.time < 0
    )
      return null;
    return value;
  } catch {
    return null;
  }
}

export function writeCheckpoint(storage, scope, checkpoint) {
  try {
    storage.setItem(checkpointKey(scope), JSON.stringify(checkpoint));
    return true;
  } catch {
    return false;
  }
}
