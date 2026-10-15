jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../lib/models/RateLimitBucket", () => ({
  __esModule: true,
  default: { findOneAndUpdate: jest.fn() },
}));
import Bucket from "../lib/models/RateLimitBucket";
import { checkRateLimit } from "../lib/rate-limit";
beforeEach(() => {
  const counts = new Map();
  Bucket.findOneAndUpdate.mockImplementation(async ({ _id }) => {
    const count = (counts.get(_id) || 0) + 1;
    counts.set(_id, count);
    return { count };
  });
});
test("parallel requests admit no more than the limit", async () => {
  const results = await Promise.all(
    Array.from({ length: 30 }, () =>
      checkRateLimit({ key: "login:ip:user", limit: 5, windowMs: 900000 }),
    ),
  );
  expect(results.filter((result) => result.success)).toHaveLength(5);
});
test("rotating email addresses cannot bypass the IP bucket", async () => {
  const results = [];
  for (let i = 0; i < 6; i++)
    results.push(
      await checkRateLimit({
        key: `login:ip:user${i}`,
        ip: "ip",
        identity: `user${i}`,
        limit: 5,
        windowMs: 900000,
      }),
    );
  expect(results.at(-1).success).toBe(false);
});
test("rotating IPs cannot bypass the account bucket", async () => {
  const results = [];
  for (let i = 0; i < 6; i++)
    results.push(
      await checkRateLimit({
        key: `login:ip${i}:user`,
        ip: `ip${i}`,
        identity: "user",
        limit: 5,
        windowMs: 900000,
      }),
    );
  expect(results.at(-1).success).toBe(false);
});
test("bad configuration fails closed", async () => {
  await expect(
    checkRateLimit({ key: "test", limit: NaN, windowMs: 1000 }),
  ).rejects.toThrow();
});
test("concurrent bucket upsert collision retries as an increment", async () => {
  Bucket.findOneAndUpdate
    .mockRejectedValueOnce({ code: 11000 })
    .mockResolvedValueOnce({ count: 2 });
  expect(
    (await checkRateLimit({ key: "test", limit: 2, windowMs: 1000 })).success,
  ).toBe(true);
});
