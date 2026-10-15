import {
  activeSceneCandles,
  CHAPEL_SLOTS,
  CHAPEL_PAGE_SIZE,
} from "@/lib/chapel-scene";
const now = Date.parse("2026-10-15T12:00:00Z");
const candle = (id, extra = {}) => ({
  _id: id,
  visibility: "public",
  expiresAt: new Date(now + 1000).toISOString(),
  ...extra,
});
test("empty sanctuary has no candles and never creates placeholders", () => {
  expect(activeSceneCandles([], now)).toEqual([]);
});
test("public scene rejects private, expired, withdrawn and hidden records", () => {
  const records = [
    candle("public"),
    candle("anonymous", { visibility: "anonymous" }),
    candle("private", { visibility: "private" }),
    candle("expired", { expiresAt: new Date(now).toISOString() }),
    candle("withdrawn", { status: "withdrawn" }),
    candle("hidden", { status: "hidden" }),
    candle("inactive", { active: false }),
  ];
  expect(activeSceneCandles(records, now).map((c) => c._id)).toEqual([
    "public",
    "anonymous",
  ]);
});
test("owner history can show authorized private candles, but never expired ones on the steps", () => {
  expect(
    activeSceneCandles(
      [
        candle("private", { visibility: "private" }),
        candle("expired", { expiresAt: new Date(now - 1).toISOString() }),
      ],
      now,
      true,
    ).map((c) => c._id),
  ).toEqual(["private"]);
});
test("candles vanish exactly at expiration, regardless of browser timer cadence", () => {
  const record = candle("one");
  expect(activeSceneCandles([record], now + 999)).toHaveLength(1);
  expect(activeSceneCandles([record], now + 1000)).toHaveLength(0);
});
test("six perspective positions stay on the marble steps and clear of the altar", () => {
  expect(CHAPEL_SLOTS).toHaveLength(CHAPEL_PAGE_SIZE);
  for (const slot of CHAPEL_SLOTS) {
    expect(slot.y - slot.height).toBeGreaterThan(66);
    expect(slot.y).toBeLessThan(83);
    expect(slot.x < 35 || slot.x > 65).toBe(true);
  }
});
