import { AUDIO_RATES } from "./audio-catalog";
import {
  readCheckpoint,
  readPreferences,
  writeCheckpoint,
} from "./audio-checkpoint";

function applyRateAndPitch(media, rate) {
  media.defaultPlaybackRate = rate;
  media.playbackRate = rate;
  media.preservesPitch = true;
  media.mozPreservesPitch = true;
  media.webkitPreservesPitch = true;
}

// One media element, one current step, one guarded completion per playback.
// Timers only save checkpoints; they never advance prayer progress.
export class RosaryAudioController {
  constructor(media, storage, onChange, onAdvance) {
    this.media = media;
    this.storage = storage;
    this.onChange = onChange;
    this.onAdvance = onAdvance;
    this.mode = "manual";
    this.rate = 1;
    this.generation = 0;
    this.playAttempt = 0;
    this.listeners = [];
    this.state = { status: "idle", time: 0, duration: 0, storageHealthy: true };
  }

  emit(patch) {
    this.state = { ...this.state, ...patch };
    this.onChange(this.state);
  }

  save() {
    if (!this.context?.clip) return;
    const { scope, stepId, clip } = this.context;
    this.emit({
      storageHealthy: writeCheckpoint(this.storage, scope, {
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
    const previousClipSrc = this.context?.clip?.src;
    this.save();
    this.invalidate();
    this.context = context;
    this.finished = false;
    this.consumed = false;
    this.wanted = keepPlaying && sameScope;
    this.emit({ status: "idle", time: 0, duration: 0 });
    if (!context.clip) {
      this.wanted = false;
      this.media.removeAttribute("src");
      this.media.load();
      this.emit({ status: context.completed ? "complete" : "unavailable" });
      return;
    }
    const saved = readCheckpoint(
      this.storage,
      context.scope,
      context.stepId,
      context.clip.id,
    );
    if (!keepPlaying && !sameScope) {
      const prefs = readPreferences(this.storage, context.scope);
      if (prefs) {
        if (AUDIO_RATES.includes(prefs.rate)) this.rate = prefs.rate;
        if (["manual", "continuous"].includes(prefs.mode))
          this.mode = prefs.mode;
      }
    }
    if (saved && !keepPlaying) {
      if (AUDIO_RATES.includes(saved.rate)) this.rate = saved.rate;
      if (["manual", "continuous"].includes(saved.mode)) this.mode = saved.mode;
      this.finished = saved.finished === true;
    }
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
      if (saved && !keepPlaying && Number.isFinite(duration))
        this.media.currentTime = Math.min(
          saved.time,
          Math.max(0, duration - 0.05),
        );
      this.emit({
        duration: Number.isFinite(duration) ? duration : 0,
        time: this.media.currentTime,
        status: this.finished ? "finished" : "paused",
      });
    });
    listen("playing", () => {
      if (!this.wanted) this.media.pause();
      else {
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
      // Throttle synchronous localStorage writes while audio is playing.
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
        // Invalidate synchronously, before React can apply the new position.
        this.invalidate();
        this.onAdvance(expected);
      } else this.wanted = false;
    });
    this.lastSaved = 0;
    const reuseLoadedMedia =
      sameScope &&
      previousClipSrc === context.clip.src &&
      this.media.src &&
      Number.isFinite(this.media.duration) &&
      this.media.duration > 0;
    applyRateAndPitch(this.media, this.rate);
    if (reuseLoadedMedia) {
      this.media.currentTime =
        saved && !keepPlaying
          ? Math.min(saved.time, Math.max(0, this.media.duration - 0.05))
          : 0;
      this.emit({
        duration: this.media.duration,
        time: this.media.currentTime,
        status: this.finished ? "finished" : "paused",
      });
    } else {
      this.media.src = context.clip.src;
      this.media.load();
    }
    if (!saved && sameScope) {
      this.save();
    }
    if (this.wanted) this.play();
  }

  async play() {
    if (!this.context?.clip) return;
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
      if (generation === this.generation && !this.wanted) this.media.pause();
    } catch (error) {
      if (generation !== this.generation || attempt !== this.playAttempt)
        return;
      this.wanted = false;
      this.emit({
        status: error.name === "NotAllowedError" ? "blocked" : "error",
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
    if (!AUDIO_RATES.includes(rate)) return;
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
    this.media.removeAttribute("src");
    this.media.load();
  }
}
