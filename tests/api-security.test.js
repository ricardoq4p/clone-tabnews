import { rejectCrossOriginMutation } from "../lib/api-security";
beforeEach(() => {
  process.env.NEXTAUTH_URL = "https://prayer.example";
});
afterEach(() => {
  delete process.env.NEXTAUTH_URL;
});
const response = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});
test("cross-origin mutations are rejected", () => {
  expect(
    rejectCrossOriginMutation(
      { method: "POST", headers: { origin: "https://attacker.example" } },
      response(),
    ),
  ).toBe(true);
  expect(
    rejectCrossOriginMutation(
      { method: "DELETE", headers: { "sec-fetch-site": "cross-site" } },
      response(),
    ),
  ).toBe(true);
});
test("same-origin requests remain supported", () => {
  expect(
    rejectCrossOriginMutation(
      { method: "POST", headers: { origin: "https://prayer.example" } },
      response(),
    ),
  ).toBe(false);
});
