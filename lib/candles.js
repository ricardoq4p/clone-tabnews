import { idOf } from "./permissions";
export const CANDLE_DURATION_MS = 168 * 60 * 60 * 1000;
export const VISIBILITIES = ["public", "anonymous", "private"];
export function candleDates(now = new Date()) {
  return {
    createdAt: new Date(now),
    expiresAt: new Date(now.getTime() + CANDLE_DURATION_MS),
  };
}
export function activePublicFilter(now = new Date()) {
  return {
    status: "active",
    visibility: { $in: ["public", "anonymous"] },
    expiresAt: { $gt: now },
  };
}
export function isCandleActive(candle, now = new Date()) {
  return (
    candle.status === "active" &&
    new Date(candle.expiresAt).getTime() > now.getTime()
  );
}
export function canReadCandle(candle, userId, now = new Date()) {
  return Boolean(
    candle &&
      (idOf(candle.ownerId) === userId ||
        (isCandleActive(candle, now) &&
          ["public", "anonymous"].includes(candle.visibility))),
  );
}
export function candleView(
  candle,
  { owner = false, prayed = false, count = 0, now = new Date() } = {},
) {
  return {
    _id: idOf(candle),
    intention: candle.intention,
    visibility: candle.visibility,
    author:
      candle.visibility === "public" || owner
        ? candle.authorName
        : "Intenção anônima",
    createdAt: candle.createdAt,
    expiresAt: candle.expiresAt,
    active: isCandleActive(candle, now),
    ...(owner ? { status: candle.status, canManage: true } : {}),
    prayed,
    supportCount: count,
  };
}
