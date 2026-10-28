import { MERCY_AUDIO_RATES } from "./audio-catalog";

export function mercyCheckpointKey(scope) {
  return `panteralab.misericordia.audio.v1.${scope}`;
}

export function readMercyPreferences(storage, scope) {
  try {
    const value = JSON.parse(storage.getItem(mercyCheckpointKey(scope)));
    if (!value || typeof value !== "object") return null;
    return { rate: value.rate, mode: value.mode };
  } catch {
    return null;
  }
}

export function readMercyCheckpoint(storage, scope, stepId, clipId) {
  try {
    const value = JSON.parse(storage.getItem(mercyCheckpointKey(scope)));
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

export function writeMercyCheckpoint(storage, scope, checkpoint) {
  try {
    storage.setItem(mercyCheckpointKey(scope), JSON.stringify(checkpoint));
    return true;
  } catch {
    return false;
  }
}

function applyRateAndPitch(media, rate) {
  media.defaultPlaybackRate = rate;
  media.playbackRate = rate;
  media.preservesPitch = true;
  media.mozPreservesPitch = true;
  media.webkitPreservesPitch = true;
}

// Single media element controller for the Chaplet of Divine Mercy.
// Defaults to continuous automatic advance after an explicit user click.
export class MercyAudioController {
  constructor(media, storage, onChange, onAdvance) {
    this.media = media;
    this.storage = storage;
    this.onChange = onChange;
    this.onAdvance = onAdvance;
    this.mode = "continuous";
    this.rate = 1;
    this.generation = 0;
    this.playAttempt = 0;
    this.listeners = [];
    this.loadedStepId = null;
    this.loadedClipSrc = null;
    this.state = {
      status: "idle",
      time: 0,
      duration: 0,
      storageHealthy: true,
    };
  }

  emit(patch) {
    this.state = { ...this.state, ...patch };
    this.onChange(this.state);
  }

  save() {
    if (!this.context?.clip) return;
    const { scope, stepId, clip } = this.context;
    this.emit({
      storageHealthy: writeMercyCheckpoint(this.storage, scope, {
        stepId,
        clipId: clip.id,
        time: this.media.currentTime || 0,
        finished: this.finished === true,
        rate: this.rate,
        mode: this.mode,
      }),
    });
  }

  invalidate() {
    this.generation++;
    this.playAttempt++;
    this.listeners.forEach(([name, fn]) =>
      this.media.removeEventListener(name, fn),
    );
    this.listeners = [];
    this.media.pause();
  }

  load(context, keepPlaying = false) {
    const sameScope = this.context?.scope === context.scope;
    const sameStep =
      sameScope &&
      this.context?.stepId === context.stepId &&
      this.context?.clip?.id === context.clip?.id;
    this.save();
    this.invalidate();
    this.context = context;
    this.wanted = Boolean(keepPlaying && sameScope);

    if (!context.clip) {
      this.wanted = false;
      this.finished = false;
      this.consumed = false;
      this.loadedStepId = null;
      this.loadedClipSrc = null;
      this.media.removeAttribute("src");
      this.media.load();
      this.emit({
        status: context.completed ? "complete" : "unavailable",
        time: 0,
        duration: 0,
      });
      return;
    }

    const saved = readMercyCheckpoint(
      this.storage,
      context.scope,
      context.stepId,
      context.clip.id,
    );

    if (!keepPlaying && !sameScope) {
      const prefs = readMercyPreferences(this.storage, context.scope);
      if (prefs) {
        if (MERCY_AUDIO_RATES.includes(prefs.rate)) this.rate = prefs.rate;
        if (["manual", "continuous"].includes(prefs.mode))
          this.mode = prefs.mode;
      }
    }

    if (saved && !keepPlaying) {
      if (MERCY_AUDIO_RATES.includes(saved.rate)) this.rate = saved.rate;
      if (["manual", "continuous"].includes(saved.mode)) this.mode = saved.mode;
      this.finished = saved.finished === true;
    } else if (!sameStep) {
      this.finished = false;
    }
    this.consumed = false;

    const initialTime =
      !keepPlaying && saved
        ? saved.time
        : sameStep && !keepPlaying
          ? this.media.currentTime || 0
          : 0;

    if (!sameStep || keepPlaying) {
      this.media.currentTime = initialTime;
    }

    this.emit({
      status: this.finished ? "finished" : initialTime > 0 ? "paused" : "idle",
      time: initialTime,
      duration:
        sameStep && Number.isFinite(this.media.duration)
          ? this.media.duration
          : 0,
    });

    const generation = this.generation;
    const listen = (name, fn) => {
      const guarded = () => {
        if (generation === this.generation) fn();
      };
      this.listeners.push([name, guarded]);
      this.media.addEventListener(name, guarded);
    };

    listen("loadedmetadata", () => {
      const duration = this.media.duration;
      applyRateAndPitch(this.media, this.rate);
      if (saved && !keepPlaying && Number.isFinite(duration)) {
        this.media.currentTime = Math.min(
          saved.time,
          Math.max(0, duration - 0.05),
        );
      }
      this.emit({
        duration: Number.isFinite(duration) ? duration : 0,
        time: this.media.currentTime,
        status: this.finished
          ? "finished"
          : this.wanted
            ? this.state.status
            : "paused",
      });
    });

    listen("playing", () => {
      if (!this.wanted) {
        this.media.pause();
      } else {
        applyRateAndPitch(this.media, this.rate);
        this.emit({ status: "playing" });
      }
    });

    listen("waiting", () => {
      if (this.wanted) this.emit({ status: "loading" });
    });

    listen("pause", () => {
      if (!this.media.ended && !this.finished) {
        this.wanted = false;
        this.emit({ status: "paused" });
        this.save();
      }
    });

    listen("timeupdate", () => {
      this.emit({ time: this.media.currentTime });
      if (Math.abs(this.media.currentTime - (this.lastSaved || 0)) >= 2) {
        this.lastSaved = this.media.currentTime;
        this.save();
      }
    });

    listen("error", () => {
      this.wanted = false;
      this.save();
      this.emit({ status: "error" });
    });

    listen("ended", () => {
      if (!this.media.ended || this.consumed) return;
      this.consumed = true;
      this.finished = true;
      this.save();
      this.emit({ status: "finished" });
      if (this.mode === "continuous" && this.wanted) {
        const expected = this.context;
        this.invalidate();
        this.onAdvance(expected);
      } else {
        this.wanted = false;
      }
    });

    this.lastSaved = 0;
    applyRateAndPitch(this.media, this.rate);
    if (!saved && sameScope) {
      this.save();
    }
    if (this.wanted) {
      this.play();
    }
  }

  prepareMediaSource() {
    if (!this.context?.clip) return;
    const { stepId, clip } = this.context;
    const sameClip =
      this.loadedClipSrc === clip.src &&
      this.media.src &&
      Number.isFinite(this.media.duration) &&
      this.media.duration > 0;
    const sameStep = sameClip && this.loadedStepId === stepId;

    if (!sameClip) {
      this.media.src = clip.src;
      this.media.load();
      this.loadedClipSrc = clip.src;
    } else if (!sameStep) {
      this.media.currentTime = 0;
    }
    this.loadedStepId = stepId;
  }

  async play() {
    if (!this.context?.clip) return;
    this.prepareMediaSource();
    if (this.finished) {
      this.media.currentTime = 0;
      this.finished = false;
      this.consumed = false;
    }
    this.wanted = true;
    const generation = this.generation;
    const attempt = ++this.playAttempt;
    applyRateAndPitch(this.media, this.rate);
    this.emit({ status: "loading" });
    try {
      await this.media.play();
      if (generation === this.generation && !this.wanted) {
        this.media.pause();
      }
    } catch (error) {
      if (generation !== this.generation || attempt !== this.playAttempt)
        return;
      this.wanted = false;
      this.emit({
        status: error?.name === "NotAllowedError" ? "blocked" : "error",
      });
    }
  }

  pause() {
    this.playAttempt++;
    this.wanted = false;
    this.media.pause();
    this.emit({ status: this.finished ? "finished" : "paused" });
    this.save();
  }

  setRate(rate) {
    if (!MERCY_AUDIO_RATES.includes(rate)) return;
    this.rate = rate;
    applyRateAndPitch(this.media, rate);
    this.save();
    this.emit({});
  }

  setMode(mode) {
    if (!["manual", "continuous"].includes(mode)) return;
    this.mode = mode;
    this.save();
    this.emit({});
  }

  destroy() {
    this.save();
    this.invalidate();
    this.loadedStepId = null;
    this.loadedClipSrc = null;
    this.media.removeAttribute("src");
    this.media.load();
  }
}
