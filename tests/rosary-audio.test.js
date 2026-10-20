import { RosaryAudioController } from "../lib/rosary/audio-controller";
import {
  readCheckpoint,
  readPreferences,
  writeCheckpoint,
} from "../lib/rosary/audio-checkpoint";
import { narrationForStep, resolveAudio } from "../lib/rosary/audio-catalog";
import { MYSTERY_SETS } from "../lib/rosary/content";
import { buildRosary } from "../lib/rosary/engine";

test("all 292 steps of the full Rosary and all four mystery sets resolve to matching MP3 clips", () => {
  const fullSteps = buildRosary("gozosos", { full: true, fatima: true });
  expect(fullSteps).toHaveLength(292);
  expect(
    fullSteps.filter((step) => step.prayer === "contemplacao"),
  ).toHaveLength(20);
  for (const step of fullSteps) {
    const clip = resolveAudio(step);
    expect(clip).not.toBeNull();
    expect(clip.src).toMatch(/^\/audio\/rosario\/demo\/[a-z-]+\.mp3$/);
    expect(clip.text).toBe(narrationForStep(step));
    expect(clip.pauseSeconds).toBe(step.prayer === "contemplacao" ? 8 : 2.2);
  }
  for (const set of MYSTERY_SETS) {
    const setSteps = buildRosary(set.id, { full: false, fatima: true });
    expect(setSteps).toHaveLength(82);
    for (const step of setSteps) {
      expect(resolveAudio(step)?.src).toMatch(/\.mp3$/);
    }
  }
  const aves = fullSteps.filter((step) => step.prayer === "ave");
  expect(aves[0].id).not.toBe(aves[1].id);
  expect(resolveAudio(aves[0]).src).toBe(resolveAudio(aves[1]).src);
});

class Media extends EventTarget {
  constructor() {
    super();
    this.currentTime = 0;
    this.duration = 30;
    this.ended = false;
    this.playbackRate = 1;
    this.pause = jest.fn();
    this.play = jest.fn(async () => this.dispatchEvent(new Event("playing")));
  }
  load() {}
  removeAttribute() {}
  fire(event) {
    this.dispatchEvent(new Event(event));
  }
}
const clip = { id: "voice1:pai", src: "/pai.mp3" };
const context = { scope: "visitor:run1", position: 4, stepId: "4-pai", clip };
const make = () => {
  const media = new Media();
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
  const advance = jest.fn();
  const controller = new RosaryAudioController(
    media,
    storage,
    jest.fn(),
    advance,
  );
  controller.load(context);
  return { controller, media, storage, advance };
};

test("loading and restoring never autoplay; pause and all four rates preserve position", async () => {
  const { controller, media, storage, advance } = make();
  expect(media.play).not.toHaveBeenCalled();
  await controller.play();
  media.currentTime = 12.4;
  for (const rate of [1, 1.25, 1.5, 2]) {
    controller.setRate(rate);
    expect(media.currentTime).toBe(12.4);
    expect(media.playbackRate).toBe(rate);
  }
  controller.pause();
  controller.load(context);
  media.fire("loadedmetadata");
  expect(media.currentTime).toBe(12.4);
  expect(controller.rate).toBe(2);
  expect(advance).not.toHaveBeenCalled();
  expect(
    readCheckpoint(storage, context.scope, context.stepId, clip.id).time,
  ).toBe(12.4);
});

test("manual mode waits at the same bead; replay does not advance", async () => {
  const { controller, media, advance } = make();
  await controller.play();
  media.ended = true;
  media.fire("ended");
  expect(controller.state.status).toBe("finished");
  expect(advance).not.toHaveBeenCalled();
  media.ended = false;
  await controller.play();
  expect(media.currentTime).toBe(0);
  media.ended = true;
  media.fire("ended");
  expect(advance).not.toHaveBeenCalled();
});

test("continuous mode consumes completion once, even with duplicate ended events", async () => {
  const { controller, media, advance } = make();
  controller.setMode("continuous");
  await controller.play();
  media.ended = true;
  media.fire("ended");
  media.fire("ended");
  expect(advance).toHaveBeenCalledTimes(1);
  expect(advance).toHaveBeenCalledWith(context);
});

test("navigation cancels the previous completion and scope changes stop playback", async () => {
  const { controller, media, advance } = make();
  controller.setMode("continuous");
  await controller.play();
  const previousListeners = [...controller.listeners];
  controller.load({ ...context, position: 5, stepId: "5-ave" }, true);
  const previousEnd = previousListeners.find(([name]) => name === "ended")[1];
  media.ended = true;
  previousEnd();
  expect(advance).not.toHaveBeenCalled();
  media.ended = false;
  controller.load({ ...context, scope: "different-account:run2" }, true);
  expect(controller.wanted).toBe(false);
});

test("buffering, failed playback, missing clips and pause never advance", async () => {
  const { controller, media, advance } = make();
  controller.setMode("continuous");
  media.play.mockRejectedValue(
    Object.assign(new Error(), { name: "NotAllowedError" }),
  );
  await controller.play();
  expect(controller.state.status).toBe("blocked");
  media.fire("waiting");
  controller.pause();
  media.fire("error");
  controller.load({ ...context, clip: null }, true);
  expect(controller.state.status).toBe("unavailable");
  expect(advance).not.toHaveBeenCalled();
});

test("invalid, replaced voice and blocked storage checkpoints are rejected safely", () => {
  const { controller, media, storage } = make();
  writeCheckpoint(storage, context.scope, {
    stepId: context.stepId,
    clipId: clip.id,
    time: -4,
  });
  expect(
    readCheckpoint(storage, context.scope, context.stepId, clip.id),
  ).toBeNull();
  media.currentTime = 10;
  controller.save();
  expect(
    readCheckpoint(storage, context.scope, context.stepId, "new-voice"),
  ).toBeNull();
  expect(
    readCheckpoint(storage, "new-run", context.stepId, clip.id),
  ).toBeNull();
  const blocked = {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  };
  expect(readCheckpoint(blocked, "scope", "step", "clip")).toBeNull();
  expect(writeCheckpoint(blocked, "scope", {})).toBe(false);
});

test("narration preserves the approved text and unknown or edited text has no audio", () => {
  expect(narrationForStep({ prayer: "pai", text: "Pai nosso." })).toBe(
    "Pai nosso.",
  );
  expect(
    narrationForStep({
      prayer: "contemplacao",
      title: "Anunciação",
      text: "Meditação.",
    }),
  ).toBe("Anunciação. Meditação.");
  expect(resolveAudio({ prayer: "pai", text: "Texto alterado" })).toBeNull();
  expect(resolveAudio(null)).toBeNull();
});

test("a rejected play promise from before pause cannot replace a later successful playback", async () => {
  const { controller, media, advance } = make();
  let rejectOld;
  media.play.mockImplementationOnce(
    () =>
      new Promise((resolve, reject) => {
        rejectOld = reject;
      }),
  );
  const oldPlay = controller.play();
  controller.pause();
  await controller.play();
  rejectOld(Object.assign(new Error(), { name: "NotAllowedError" }));
  await oldPlay;
  expect(controller.state.status).toBe("playing");
  expect(controller.wanted).toBe(true);
  expect(advance).not.toHaveBeenCalled();
});

test("pausing in the silence interval preserves time and prevents automatic advance", async () => {
  const { controller, media, advance } = make();
  controller.setMode("continuous");
  await controller.play();
  media.currentTime = 28;
  controller.pause();
  media.ended = true;
  media.fire("ended");
  expect(media.currentTime).toBe(28);
  expect(advance).not.toHaveBeenCalled();
});

test("rate and mode preferences persist across step navigation and reload without reloading identical decade clips", async () => {
  const { controller, media, storage } = make();
  media.load = jest.fn();
  controller.setRate(1.5);
  controller.setMode("continuous");
  const nextStep = {
    scope: context.scope,
    position: 5,
    stepId: "5-ave",
    clip: { id: "voice1:ave", src: "/ave.mp3" },
  };
  controller.load(nextStep, false);
  expect(media.load).toHaveBeenCalledTimes(1);
  media.src = "http://localhost/ave.mp3";
  media.duration = 19.221;
  media.currentTime = 19.221;
  // Transitioning to the next Ave-Maria in the same decade reuses the already loaded audio buffer.
  controller.load(
    {
      scope: context.scope,
      position: 6,
      stepId: "6-ave",
      clip: { id: "voice1:ave", src: "/ave.mp3" },
    },
    true,
  );
  expect(media.load).toHaveBeenCalledTimes(1);
  expect(media.currentTime).toBe(0);
  expect(media.playbackRate).toBe(1.5);
  expect(media.preservesPitch).toBe(true);
  expect(media.mozPreservesPitch).toBe(true);
  expect(media.webkitPreservesPitch).toBe(true);
  expect(readPreferences(storage, context.scope)).toEqual({
    rate: 1.5,
    mode: "continuous",
  });
  // Simulating a page reload on step 6-ave restores rate and mode from storage.
  const reloadedMedia = new Media();
  const reloadedController = new RosaryAudioController(
    reloadedMedia,
    storage,
    jest.fn(),
    jest.fn(),
  );
  reloadedController.load(
    {
      scope: context.scope,
      position: 6,
      stepId: "6-ave",
      clip: { id: "voice1:ave", src: "/ave.mp3" },
    },
    false,
  );
  expect(reloadedController.rate).toBe(1.5);
  expect(reloadedController.mode).toBe("continuous");
});
