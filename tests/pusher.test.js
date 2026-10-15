jest.mock("pusher", () =>
  jest
    .fn()
    .mockImplementation(() => ({ trigger: jest.fn().mockResolvedValue({}) })),
);
import Pusher from "pusher";
import { getPusher, notifyChange } from "../lib/pusher";
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
