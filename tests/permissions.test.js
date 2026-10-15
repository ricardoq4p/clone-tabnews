import {
  canReadCommunity,
  canReadMessage,
  canDeleteContent,
  isSessionCurrent,
} from "../lib/permissions";
import {
  escapeHtml,
  escapeRegex,
  isObjectId,
  validImageUrl,
} from "../lib/validation";
import { getClientIp } from "../lib/request";
const privateCommunity = {
  privacy: "private",
  ownerId: "owner",
  members: ["member"],
};
test.each(["owner", "member"])("private access granted to %s", (id) => {
  expect(canReadCommunity(privateCommunity, id)).toBe(true);
});
test.each([undefined, "outsider"])("private access denied to %s", (id) => {
  expect(canReadCommunity(privateCommunity, id)).toBe(false);
});
test("missing, archived and orphaned communities fail closed", () => {
  expect(canReadCommunity(null, "owner")).toBe(false);
  expect(
    canReadCommunity({ ...privateCommunity, deletedAt: new Date() }, "owner"),
  ).toBe(false);
  expect(canReadMessage({ communityId: "deleted" }, null, "owner")).toBe(false);
  expect(canReadMessage({ communityId: null }, null)).toBe(true);
});
test("matching display name never proves authorship", () => {
  expect(
    canDeleteContent(
      { author: "Maria" },
      { user: { id: "other", name: "Maria" } },
    ),
  ).toBe(false);
  expect(canDeleteContent({ userId: "owner" }, { user: { id: "owner" } })).toBe(
    true,
  );
});
test("revoked, deleted, disabled and unverified accounts have invalid sessions", () => {
  expect(isSessionCurrent(null, {})).toBe(false);
  expect(
    isSessionCurrent(
      { isVerified: true, sessionVersion: 2 },
      { sessionVersion: 1 },
    ),
  ).toBe(false);
  expect(
    isSessionCurrent({ isVerified: true, disabledAt: new Date() }, {}),
  ).toBe(false);
  expect(isSessionCurrent({ isVerified: false }, {})).toBe(false);
  expect(isSessionCurrent({ isVerified: true }, {})).toBe(true);
});
test("email HTML and regex names remain literal", () => {
  expect(escapeHtml('<a href="x">&')).toBe("&lt;a href=&quot;x&quot;&gt;&amp;");
  expect(new RegExp(`^${escapeRegex("a.*[x]")}$`).test("aZZx")).toBe(false);
  expect(new RegExp(`^${escapeRegex("a.*[x]")}$`).test("a.*[x]")).toBe(true);
});
test("image URLs are restricted to the configured Cloudinary upload namespace", () => {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "test-cloud";
  expect(
    validImageUrl(
      "https://res.cloudinary.com/test-cloud/image/upload/avatar.png",
    ),
  ).toBe(true);
  expect(
    validImageUrl("https://res.cloudinary.com/other/image/upload/avatar.png"),
  ).toBe(false);
  expect(validImageUrl("javascript:alert(1)")).toBe(false);
  expect(validImageUrl("https://evil.example/avatar.png")).toBe(false);
});
test("proxy headers require an explicit trusted-proxy configuration", () => {
  const req = {
    headers: { "x-forwarded-for": "forged" },
    socket: { remoteAddress: "direct" },
  };
  delete process.env.TRUST_PROXY_HEADERS;
  expect(getClientIp(req)).toBe("direct");
  process.env.TRUST_PROXY_HEADERS = "true";
  expect(getClientIp(req)).toBe("forged");
  delete process.env.TRUST_PROXY_HEADERS;
  expect(isObjectId({ $ne: null })).toBe(false);
});
