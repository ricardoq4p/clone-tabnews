jest.mock("pusher", () =>
  jest
    .fn()
    .mockImplementation(() => ({ trigger: jest.fn().mockResolvedValue({}) })),
);
import Pusher from "pusher";
import { getPusher, notifyChange } from "../lib/pusher";
beforeEach(() => {
  process.env.PUSHER_APP_ID = "local-test";
  process.env.PUSHER_KEY = "test-key";
  process.env.PUSHER_SECRET = "test-secret";
  process.env.PUSHER_CLUSTER = "test-cluster";
});
afterEach(() => {
  for (const key of [
    "PUSHER_APP_ID",
    "PUSHER_KEY",
    "PUSHER_SECRET",
    "PUSHER_CLUSTER",
  ])
    delete process.env[key];
});
test("unconfigured realtime does not attempt an external service", async () => {
  delete process.env.PUSHER_KEY;
  await notifyChange("feed", "new-message");
  expect(Pusher).not.toHaveBeenCalled();
});
test("private events include no text, author or identifiers", async () => {
  await notifyChange("feed", "new-message", "community-id");
  expect(getPusher().trigger).toHaveBeenCalledWith(
    "private-community-community-id",
    "new-message",
    { refresh: true },
  );
  expect(Pusher).toHaveBeenCalledTimes(1);
});
test("delivery failure cannot turn a persisted post into an HTTP failure", async () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  getPusher().trigger.mockRejectedValueOnce(new Error("network"));
  await expect(notifyChange("feed", "new-message")).resolves.toBeUndefined();
  spy.mockRestore();
});
