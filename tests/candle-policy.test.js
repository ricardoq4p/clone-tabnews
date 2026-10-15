import {
  CANDLE_DURATION_MS,
  candleDates,
  activePublicFilter,
  canReadCandle,
  candleView,
  isCandleActive,
} from "../lib/candles";
const start = new Date("2026-10-15T18:42:12.123Z");
const candle = {
  _id: "candle-id",
  ownerId: "secret-owner",
  authorName: "Nome reservado",
  email: "secret@example.com",
  avatar: "secret-avatar",
  intention: "Pela família",
  visibility: "anonymous",
  status: "active",
  ...candleDates(start),
};
test("expiration is exactly 168 hours, including minutes, seconds and milliseconds", () => {
  expect(CANDLE_DURATION_MS).toBe(604800000);
  expect(candle.expiresAt.toISOString()).toBe("2026-10-22T18:42:12.123Z");
  expect(candle.expiresAt.getTime() - candle.createdAt.getTime()).toBe(
    168 * 3600000,
  );
  expect(start.toISOString()).toBe("2026-10-15T18:42:12.123Z");
});
test("one millisecond before expiry is active; exact expiry is not", () => {
  expect(isCandleActive(candle, new Date(candle.expiresAt.getTime() - 1))).toBe(
    true,
  );
  expect(isCandleActive(candle, candle.expiresAt)).toBe(false);
  expect(canReadCandle(candle, undefined, candle.expiresAt)).toBe(false);
});
test("public database filter uses strict greater-than and excludes private or moderated intentions", () => {
  expect(activePublicFilter(start)).toEqual({
    status: "active",
    visibility: { $in: ["public", "anonymous"] },
    expiresAt: { $gt: start },
  });
});
test.each(["private", "hidden", "withdrawn"])(
  "%s intention is never publicly readable",
  (state) => {
    const item = {
      ...candle,
      ...(state === "private" ? { visibility: state } : { status: state }),
    };
    expect(canReadCandle(item, "outsider", start)).toBe(false);
    expect(canReadCandle(item, "secret-owner", start)).toBe(true);
  },
);
test("anonymous public serialization has no author association, email, avatar or owner ID", () => {
  const value = candleView(candle, { now: start, count: 3 });
  expect(value.author).toBe("Intenção anônima");
  const text = JSON.stringify(value);
  for (const secret of [
    "secret-owner",
    "Nome reservado",
    "secret@example.com",
    "secret-avatar",
    "ownerId",
  ])
    expect(text).not.toContain(secret);
  expect(value.supportCount).toBe(3);
  expect(value.canManage).toBeUndefined();
});
test("owner retains access to expired private history with no public visibility", () => {
  const item = { ...candle, visibility: "private" };
  expect(canReadCandle(item, "secret-owner", item.expiresAt)).toBe(true);
  expect(canReadCandle(item, "outsider", item.expiresAt)).toBe(false);
  expect(candleView(item, { owner: true, now: item.expiresAt })).toMatchObject({
    active: false,
    canManage: true,
    author: "Nome reservado",
  });
});
