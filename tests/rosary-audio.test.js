import { RosaryAudioController } from "../lib/rosary/audio-controller";
import {
  readCheckpoint,
  writeCheckpoint,
} from "../lib/rosary/audio-checkpoint";
import { narrationForStep, resolveAudio } from "../lib/rosary/audio-catalog";
import { buildRosary } from "../lib/rosary/engine";

test("demo audio matches prayers and first mystery while other meditations stay unavailable", () => {
  const steps = buildRosary("gozosos", { full: true, fatima: true });
  for (const step of steps) {
    if (step.prayer !== "contemplacao" || step.mystery.id === "anunciacao")
      expect(resolveAudio(step)?.src).toMatch(/\.mp3$/);
    else expect(resolveAudio(step)).toBeNull();
  }
  const aves = steps.filter((step) => step.prayer === "ave");
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
