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
export function homeChapelSummary(candles = [], now = Date.now()) {
  const active = activeSceneCandles(
    Array.isArray(candles) ? candles : [],
    now,
    false,
  );
  const displayed = active.slice(0, CHAPEL_PAGE_SIZE);
  const featured = displayed[0] || null;
  if (!featured) {
    return {
      activeCount: 0,
      displayed: [],
      featured: null,
      authorLabel: null,
      intentionSnippet: null,
    };
  }
  const authorLabel =
    featured.visibility === "public" &&
    typeof featured.author === "string" &&
    featured.author.trim() &&
    featured.author.trim() !== "Intenção anônima"
      ? featured.author.trim()
      : "Intenção anônima";
  const rawIntention =
    typeof featured.intention === "string" ? featured.intention.trim() : "";
  const intentionSnippet =
    rawIntention.length > 96
      ? `${rawIntention.slice(0, 93).trimEnd()}…`
      : rawIntention;
  return {
    activeCount: active.length,
    displayed,
    featured,
    authorLabel,
    intentionSnippet,
  };
}
