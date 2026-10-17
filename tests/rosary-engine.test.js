import fs from "fs";
import path from "path";
import {
  DEFAULT_CONTENT,
  MYSTERY_SETS,
  MYSTERY_PAINTINGS,
  resolveMysteryArtwork,
} from "../lib/rosary/content";
import {
  brasiliaDay,
  mysteriesForDay,
  buildRosary,
  newProgress,
  validProgress,
} from "../lib/rosary/engine";
test.each([
  ["2026-10-12", "gozosos"],
  ["2026-10-13", "dolorosos"],
  ["2026-10-14", "gloriosos"],
  ["2026-10-15", "luminosos"],
  ["2026-10-16", "dolorosos"],
  ["2026-10-17", "gozosos"],
  ["2026-10-18", "gloriosos"],
])("Brasília assigns %s to %s", (day, set) => {
  expect(mysteriesForDay(new Date(`${day}T15:00:00Z`)).id).toBe(set);
});
test("Brasília midnight, rather than UTC midnight, changes the suggested set", () => {
  expect(mysteriesForDay(new Date("2026-10-16T02:59:59.999Z")).id).toBe(
    "luminosos",
  );
  expect(mysteriesForDay(new Date("2026-10-16T03:00:00.000Z")).id).toBe(
    "dolorosos",
  );
  expect(brasiliaDay(new Date("2026-10-16T03:00:00Z"))).toBe(5);
});
test.each(MYSTERY_SETS.map((set) => [set.id]))(
  "%s includes exactly five decades, 53 Hail Marys and six Our Fathers",
  (id) => {
    const steps = buildRosary(id);
    expect(steps.filter((step) => step.prayer === "ave")).toHaveLength(53);
    expect(steps.filter((step) => step.prayer === "pai")).toHaveLength(6);
    expect(steps.filter((step) => step.prayer === "contemplacao")).toHaveLength(
      5,
    );
    expect(steps.filter((step) => step.prayer === "gloria")).toHaveLength(6);
    expect(steps.filter((step) => step.prayer === "fatima")).toHaveLength(5);
    expect(new Set(steps.map((step) => step.id)).size).toBe(steps.length);
  },
);
test("full rosary includes all twenty mysteries and 203 Hail Marys", () => {
  const steps = buildRosary("gozosos", { full: true });
  expect(steps.filter((step) => step.prayer === "contemplacao")).toHaveLength(
    20,
  );
  expect(steps.filter((step) => step.prayer === "ave")).toHaveLength(203);
  expect(steps.filter((step) => step.prayer === "pai")).toHaveLength(21);
});
test("optional Fatima prayer never alters decade bead counts", () => {
  const steps = buildRosary("gozosos", { fatima: false });
  expect(steps.some((step) => step.prayer === "fatima")).toBe(false);
  expect(steps.filter((step) => step.prayer === "ave")).toHaveLength(53);
});
test("progress may complete the route but cannot exceed it or silently change content version", () => {
  const progress = newProgress("gozosos");
  const steps = buildRosary("gozosos");
  expect(validProgress(progress)).toBe(true);
  expect(validProgress({ ...progress, position: steps.length })).toBe(true);
  expect(validProgress({ ...progress, position: steps.length + 1 })).toBe(
    false,
  );
  expect(validProgress({ ...progress, position: -1 })).toBe(false);
  expect(validProgress({ ...progress, version: "unknown" })).toBe(false);
  expect(validProgress({ ...progress, position: "1" })).toBe(false);
  expect(validProgress({ ...progress, full: "false" })).toBe(false);
});
test("all mysteries have scripture, original meditations and local credited images that exist on disk", () => {
  expect(DEFAULT_CONTENT.sets).toHaveLength(4);
  expect(Object.keys(MYSTERY_PAINTINGS)).toHaveLength(19);
  for (const set of DEFAULT_CONTENT.sets)
    for (const mystery of set.mysteries) {
      expect(mystery.scripture.length).toBeGreaterThan(3);
      expect(mystery.meditation.length).toBeGreaterThan(50);
      if (mystery.id === "batismo") {
        expect(mystery.image).toBe("/sacred/batismo.svg");
      } else {
        expect(mystery.image).toBe(
          `/images/rosario/${set.id}/${mystery.id}.webp`,
        );
      }
      const diskPath = path.join(
        process.cwd(),
        "public",
        mystery.image.replace(/^\//, ""),
      );
      expect(fs.existsSync(diskPath)).toBe(true);
      expect(mystery.credit).toBeTruthy();
      expect(mystery.imageAlt).toBeTruthy();

      const resolved = resolveMysteryArtwork({
        ...mystery,
        image: `/sacred/${mystery.id}.svg`,
      });
      expect(resolved.image).toBe(mystery.image);
    }
});
