jest.mock("../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
jest.mock("../lib/models/RosaryEdition", () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));
jest.mock("../lib/db", () => ({ __esModule: true, default: jest.fn() }));
import { DEFAULT_CONTENT } from "../lib/rosary/content";
import { prepareEdition, getRosaryContent } from "../lib/rosary/editions";
const copy = () => JSON.parse(JSON.stringify(DEFAULT_CONTENT));
test("publishing creates a distinct version without modifying the archived seed", () => {
  const input = copy();
  input.sets[0].mysteries[0].meditation = "Meditação revisada para este teste.";
  const result = prepareEdition(input);
  expect(result.version).not.toBe(DEFAULT_CONTENT.version);
  expect(DEFAULT_CONTENT.sets[0].mysteries[0].meditation).not.toBe(
    input.sets[0].mysteries[0].meditation,
  );
});
test("an existing built-in edition remains available without a database", async () => {
  expect(await getRosaryContent(DEFAULT_CONTENT.version)).toBe(DEFAULT_CONTENT);
});
test("invalid remote images and executable URLs cannot be published", () => {
  const input = copy();
  input.sets[0].mysteries[0].image = "javascript:alert(1)";
  expect(() => prepareEdition(input)).toThrow();
  input.sets[0].mysteries[0].image = "https://untrusted.example/image.png";
  expect(() => prepareEdition(input)).toThrow();
});
test("editions must preserve all twenty identified mysteries", () => {
  const input = copy();
  input.sets[0].mysteries.pop();
  expect(() => prepareEdition(input)).toThrow();
});
test("unknown old editions are not silently replaced by the latest", async () => {
  delete process.env.MONGODB_URI;
  await expect(getRosaryContent("missing-version")).rejects.toThrow();
});
