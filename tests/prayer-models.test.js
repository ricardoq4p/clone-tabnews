import Candle from "../lib/models/Candle";
import PrayerSupport from "../lib/models/PrayerSupport";
test("candle storage has no automatic TTL deletion", () => {
  expect(
    Candle.schema
      .indexes()
      .some(([, options]) => options.expireAfterSeconds !== undefined),
  ).toBe(false);
});
test("database uniqueness covers user, target type and target ID", () => {
  expect(PrayerSupport.schema.indexes()).toEqual(
    expect.arrayContaining([
      [
        { userId: 1, targetType: 1, targetId: 1 },
        expect.objectContaining({ unique: true }),
      ],
    ]),
  );
});
