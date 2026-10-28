import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { DEFAULT_MERCY_CONTENT } from "./content";
import {
  buildMercyChaplet,
  newMercyProgress,
  validMercyProgress,
} from "./engine";
import { MercyAudioController } from "./audio-controller";
import { resolveMercyAudio } from "./audio-catalog";

function persistProgress(key, progress, runId) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ progress, runId }));
    return true;
  } catch {
    return false;
  }
}

export function useMercyChaplet() {
  const { data: session, status } = useSession();
  const account = session?.user?.id;
  const storageKey = `panteralab.misericordia.v1.${account || "visitor"}`;

  const [progress, setProgress] = useState(null);
  const [defaultClosingPrayer, setDefaultClosingPrayer] = useState(true);
  const [loadedKey, setLoadedKey] = useState(null);
  const [runId, setRunId] = useState("initial");
  const [saveHealthy, setSaveHealthy] = useState(true);

  const runRef = useRef("initial");
  const currentProgressRef = useRef(null);
  const controllerRef = useRef(null);

  const [audioState, setAudioState] = useState({
    status: "idle",
    time: 0,
    duration: 0,
    storageHealthy: true,
  });
  const [audioPrefs, setAudioPrefs] = useState({
    rate: 1,
    mode: "continuous",
  });

  const syncAudioStep = useCallback(
    (targetPosition, closingPrayerFlag, keepPlaying = false) => {
      const instance = controllerRef.current;
      if (!instance) return;
      const list = buildMercyChaplet(
        { closingPrayer: closingPrayerFlag },
        DEFAULT_MERCY_CONTENT,
      );
      const isComplete = targetPosition >= list.length;
      const targetStep = !isComplete ? list[targetPosition] : null;
      const targetClip = resolveMercyAudio(targetStep);
      const targetScope = `${storageKey}:${runRef.current}`;
      instance.load(
        {
          scope: targetScope,
          position: targetPosition,
          stepId: targetStep?.id || null,
          clip: targetClip,
          completed: isComplete,
        },
        keepPlaying,
      );
    },
    [storageKey],
  );

  useEffect(() => {
    if (status === "loading") return undefined;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      let restored = null;
      let restoredRunId = "run-1";
      try {
        const raw = JSON.parse(window.localStorage.getItem(storageKey));
        if (raw?.progress && validMercyProgress(raw.progress)) {
          restored = raw.progress;
          restoredRunId =
            raw.runId ||
            (typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : String(Date.now()));
        }
      } catch {
        /* ignore invalid local storage */
      }
      currentProgressRef.current = restored;
      runRef.current = restoredRunId;
      setProgress(restored);
      setRunId(restoredRunId);
      setLoadedKey(storageKey);
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey, status]);

  const updateProgress = useCallback(
    (next) => {
      const resolved =
        typeof next === "function" ? next(currentProgressRef.current) : next;
      if (!resolved) return null;
      const updated = { ...resolved, updatedAt: new Date().toISOString() };
      currentProgressRef.current = updated;
      setProgress(updated);
      setSaveHealthy(persistProgress(storageKey, updated, runRef.current));
      return updated;
    },
    [storageKey],
  );

  const advanceIfCurrent = useCallback(
    (expectedPosition, expectedScope) => {
      const currentScope = `${storageKey}:${runRef.current}`;
      const currentPos = currentProgressRef.current?.position;
      if (expectedScope !== currentScope || currentPos !== expectedPosition) {
        return false;
      }
      const nextPos = expectedPosition + 1;
      const updated = updateProgress((prev) => ({
        ...prev,
        position: nextPos,
      }));
      if (updated) {
        syncAudioStep(updated.position, updated.closingPrayer, true);
      }
      return true;
    },
    [storageKey, syncAudioStep, updateProgress],
  );

  const advanceRef = useRef(advanceIfCurrent);
  useEffect(() => {
    advanceRef.current = advanceIfCurrent;
  }, [advanceIfCurrent]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Audio === "undefined") return;
    const media = new Audio();
    media.preload = "none";
    const instance = new MercyAudioController(
      media,
      {
        getItem: (k) => window.localStorage.getItem(k),
        setItem: (k, v) => window.localStorage.setItem(k, v),
      },
      (nextState) => {
        setAudioState(nextState);
        setAudioPrefs({ rate: instance.rate, mode: instance.mode });
      },
      (expected) => advanceRef.current(expected.position, expected.scope),
    );
    controllerRef.current = instance;
    const onPageHide = () => instance.save();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      instance.destroy();
      controllerRef.current = null;
    };
  }, []);

  const closingPrayerEnabled = progress
    ? Boolean(progress.closingPrayer)
    : defaultClosingPrayer;

  const steps = buildMercyChaplet(
    { closingPrayer: closingPrayerEnabled },
    DEFAULT_MERCY_CONTENT,
  );

  const completed = Boolean(progress && progress.position >= steps.length);
  const step = progress && !completed ? steps[progress.position] : null;
  const clip = resolveMercyAudio(step);
  const audioScope = `${storageKey}:${runId}`;
  const ready = loadedKey === storageKey && status !== "loading";

  useEffect(() => {
    const instance = controllerRef.current;
    if (!instance || !ready || !progress) return;
    const targetScope = `${storageKey}:${runRef.current}`;
    const targetStepId = step?.id || null;
    if (
      instance.context?.scope === targetScope &&
      instance.context?.position === progress.position &&
      instance.context?.stepId === targetStepId &&
      instance.context?.completed === completed
    ) {
      return;
    }
    syncAudioStep(progress.position, progress.closingPrayer, instance.wanted);
  }, [
    ready,
    progress,
    step?.id,
    completed,
    audioScope,
    storageKey,
    syncAudioStep,
  ]);

  const start = useCallback(
    ({ closingPrayer = true, autoPlay = false } = {}) => {
      const nextRunId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `run-${Date.now()}`;
      runRef.current = nextRunId;
      setRunId(nextRunId);
      const fresh = newMercyProgress({ closingPrayer }, DEFAULT_MERCY_CONTENT);
      updateProgress(fresh);
      syncAudioStep(0, fresh.closingPrayer, false);
      if (autoPlay) {
        controllerRef.current?.play();
      }
    },
    [syncAudioStep, updateProgress],
  );

  const go = useCallback(
    (nextPosition) => {
      if (!currentProgressRef.current) return;
      const list = buildMercyChaplet(
        { closingPrayer: currentProgressRef.current.closingPrayer },
        DEFAULT_MERCY_CONTENT,
      );
      const bounded = Math.max(0, Math.min(list.length, nextPosition));
      if (bounded === currentProgressRef.current.position) return;
      const instance = controllerRef.current;
      const keepPlaying = Boolean(instance?.wanted);
      if (instance) {
        instance.save();
        instance.invalidate();
      }
      const updated = updateProgress((prev) => ({
        ...prev,
        position: bounded,
      }));
      if (updated) {
        syncAudioStep(updated.position, updated.closingPrayer, keepPlaying);
      }
    },
    [syncAudioStep, updateProgress],
  );

  const setClosingPrayer = useCallback(
    (enabled) => {
      const flag = Boolean(enabled);
      setDefaultClosingPrayer(flag);
      if (!currentProgressRef.current) return;
      const list = buildMercyChaplet(
        { closingPrayer: flag },
        DEFAULT_MERCY_CONTENT,
      );
      const bounded = Math.min(
        currentProgressRef.current.position,
        list.length,
      );
      const keepPlaying = Boolean(controllerRef.current?.wanted);
      const updated = updateProgress((prev) => ({
        ...prev,
        closingPrayer: flag,
        position: bounded,
      }));
      if (updated) {
        syncAudioStep(updated.position, updated.closingPrayer, keepPlaying);
      }
    },
    [syncAudioStep, updateProgress],
  );

  return {
    content: DEFAULT_MERCY_CONTENT,
    ready,
    progress,
    closingPrayer: closingPrayerEnabled,
    steps,
    step,
    completed,
    saveHealthy,
    start,
    go,
    setClosingPrayer,
    audio: {
      ...audioState,
      ...audioPrefs,
      clip,
      available: Boolean(clip),
      inSilence: Boolean(
        clip?.narrationEnd && audioState.time >= clip.narrationEnd,
      ),
      play: () => controllerRef.current?.play(),
      pause: () => controllerRef.current?.pause(),
      setRate: (rate) => controllerRef.current?.setRate(rate),
      setMode: (mode) => controllerRef.current?.setMode(mode),
    },
  };
}
