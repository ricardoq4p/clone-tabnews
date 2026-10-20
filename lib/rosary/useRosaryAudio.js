import { useCallback, useEffect, useRef, useState } from "react";
import { RosaryAudioController } from "./audio-controller";
import { resolveAudio } from "./audio-catalog";

export function useRosaryAudio({ rosary, step, active, enabled, completed }) {
  const controller = useRef(null);
  const latest = useRef(rosary);
  useEffect(() => {
    latest.current = rosary;
  }, [rosary]);
  const [state, setState] = useState({ status: "idle", time: 0, duration: 0 });
  const [preferences, setPreferences] = useState({ rate: 1, mode: "manual" });
  const clip = resolveAudio(step);
  const clipId = clip?.id;
  const stepId = step?.id;
  const position = rosary.progress?.position;
  const scope = rosary.audioScope;
  useEffect(() => {
    if (!enabled) return;
    const media = new Audio();
    media.preload = "metadata";
    const instance = new RosaryAudioController(
      media,
      {
        getItem: (key) => window.localStorage.getItem(key),
        setItem: (key, value) => window.localStorage.setItem(key, value),
      },
      (next) => {
        setState(next);
        setPreferences({ rate: instance.rate, mode: instance.mode });
      },
      (expected) =>
        latest.current.advanceIfCurrent(expected.position, expected.scope),
    );
    controller.current = instance;
    const save = () => instance.save();
    window.addEventListener("pagehide", save);
    return () => {
      window.removeEventListener("pagehide", save);
      instance.destroy();
      controller.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    const instance = controller.current;
    if (!instance) return;
    if (!active) {
      instance.pause();
      return;
    }
    instance.load(
      { scope, position, stepId, clip: resolveAudio(step), completed },
      instance.wanted,
    );
    // The identity covers all audio-affecting inputs; step is rebuilt each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, active, scope, position, stepId, clipId, completed]);

  const navigate = useCallback((action) => {
    const instance = controller.current;
    if (instance) {
      const keepPlaying = instance.wanted;
      instance.save();
      instance.invalidate();
      instance.wanted = keepPlaying;
    }
    action();
  }, []);

  return {
    ...state,
    ...preferences,
    available: Boolean(clip),
    inSilence: Boolean(clip && state.time >= clip.narrationEnd),
    contemplating: step?.prayer === "contemplacao",
    play: () => controller.current?.play(),
    pause: () => controller.current?.pause(),
    setRate: (rate) => controller.current?.setRate(rate),
    setMode: (mode) => controller.current?.setMode(mode),
    navigate,
  };
}
