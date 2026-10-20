jest.mock("../lib/models/PrayerSupport", () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}));
import PrayerSupport from "../lib/models/PrayerSupport";
import { recordPrayer } from "../lib/prayer-support";
import ActualPrayerSupport from "../lib/models/PrayerSupport";
test("concurrent repeated requests have one record for the same user and target", async () => {
  const records = new Set();
  PrayerSupport.create.mockImplementation(async (value) => {
    const key = `${value.userId}:${value.targetType}:${value.targetId}`;
    if (records.has(key)) throw { code: 11000 };
    records.add(key);
  });
  PrayerSupport.countDocuments.mockImplementation(async () => records.size);
  const results = await Promise.all(
    Array.from({ length: 30 }, () =>
      recordPrayer("candle", "target", "same-user"),
    ),
  );
  expect(records.size).toBe(1);
  expect(results.filter((item) => item.created)).toHaveLength(1);
  expect(results.every((item) => item.prayed && item.supportCount === 1)).toBe(
    true,
  );
  expect(ActualPrayerSupport.init).toHaveBeenCalled();
});
test("non-duplicate persistence errors are never reported as success", async () => {
  PrayerSupport.create.mockRejectedValueOnce(new Error("unavailable"));
  await expect(recordPrayer("candle", "target", "user")).rejects.toThrow(
    "unavailable",
  );
});
