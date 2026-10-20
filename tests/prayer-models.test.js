import Candle from "../lib/models/Candle";
import PrayerSupport from "../lib/models/PrayerSupport";
import Notification from "../lib/models/Notification";
import Comment from "../lib/models/Comment";
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

test("notification indexes support recipient history, unread count and deduplication", () => {
  expect(Notification.schema.indexes()).toEqual(
    expect.arrayContaining([
      [{ recipientId: 1, _id: -1 }, expect.any(Object)],
      [{ recipientId: 1, readAt: 1 }, expect.any(Object)],
      [
        { recipientId: 1, dedupeKey: 1 },
        expect.objectContaining({ unique: true }),
      ],
    ]),
  );
});

test("idempotency keys prevent duplicate authenticated comments on retries", () => {
  expect(Comment.schema.indexes()).toEqual(
    expect.arrayContaining([
      [
        { userId: 1, messageId: 1, idempotencyKey: 1 },
        expect.objectContaining({
          unique: true,
          partialFilterExpression: {
            idempotencyKey: { $type: "string" },
          },
        }),
      ],
    ]),
  );
});
