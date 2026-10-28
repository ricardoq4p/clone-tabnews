import {
  activeSceneCandles,
  CHAPEL_SLOTS,
  CHAPEL_PAGE_SIZE,
  homeChapelSummary,
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
test("homeChapelSummary reflects active public and anonymous candles deterministically while protecting privacy and expiration", () => {
  expect(homeChapelSummary([], now)).toEqual({
    activeCount: 0,
    displayed: [],
    featured: null,
    authorLabel: null,
    intentionSnippet: null,
  });

  const publicCandle = candle("pub-1", {
    visibility: "public",
    author: "Maria Clara",
    intention: "Pela saúde e paz da minha família.",
  });
  const pubSummary = homeChapelSummary([publicCandle], now);
  expect(pubSummary.activeCount).toBe(1);
  expect(pubSummary.displayed).toHaveLength(1);
  expect(pubSummary.featured._id).toBe("pub-1");
  expect(pubSummary.authorLabel).toBe("Maria Clara");
  expect(pubSummary.intentionSnippet).toBe(
    "Pela saúde e paz da minha família.",
  );

  const anonCandle = candle("anon-1", {
    visibility: "anonymous",
    author: "Nome Secreto Que Nunca Deve Aparecer",
    intention: "Por uma graça urgente.",
  });
  const anonSummary = homeChapelSummary([anonCandle], now);
  expect(anonSummary.activeCount).toBe(1);
  expect(anonSummary.authorLabel).toBe("Intenção anônima");
  expect(anonSummary.intentionSnippet).toBe("Por uma graça urgente.");

  const privateAndExpired = [
    candle("priv-1", {
      visibility: "private",
      author: "Autor Privado",
      intention: "Intenção estritamente privada",
    }),
    candle("exp-1", {
      visibility: "public",
      author: "Autor Expirado",
      intention: "Vela já expirada",
      expiresAt: new Date(now).toISOString(),
    }),
  ];
  expect(homeChapelSummary(privateAndExpired, now).activeCount).toBe(0);
  expect(homeChapelSummary(privateAndExpired, now).featured).toBeNull();

  const manyCandles = Array.from({ length: 8 }, (_, idx) =>
    candle(`c-${idx + 1}`, {
      visibility: "public",
      author: `Fiel ${idx + 1}`,
      intention: "A".repeat(120),
    }),
  );
  const manySummary = homeChapelSummary(manyCandles, now);
  expect(manySummary.activeCount).toBe(8);
  expect(manySummary.displayed).toHaveLength(CHAPEL_PAGE_SIZE);
  expect(manySummary.featured._id).toBe("c-1");
  expect(manySummary.intentionSnippet).toHaveLength(94);
  expect(manySummary.intentionSnippet.endsWith("…")).toBe(true);
});
