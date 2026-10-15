// Scene receives only the already-authorized candle DTOs from the page.
export const CHAPEL_PAGE_SIZE = 6;
export const CHAPEL_SLOTS = [
  { x: 29, y: 73.2, height: 6.1 },
  { x: 71, y: 73.2, height: 6.1 },
  { x: 25, y: 77.4, height: 6.8 },
  { x: 75, y: 77.4, height: 6.8 },
  { x: 19, y: 81.8, height: 7.5 },
  { x: 81, y: 81.8, height: 7.5 },
];
export function activeSceneCandles(candles, now, history = false) {
  return candles.filter(
    (candle) =>
      (!candle.status || candle.status === "active") &&
      candle.active !== false &&
      new Date(candle.expiresAt).getTime() > now &&
      (history || candle.visibility !== "private"),
  );
}
