import { localSmtpOptions } from "@/lib/local-homologation";
const local = {
  PANTERALAB_HOMOLOGATION: "local",
  PANTERALAB_LOCAL_SMTP: "true",
  NEXTAUTH_URL: "http://localhost:3107",
  MONGODB_URI: "mongodb://test:password@127.0.0.1:27027/panteralab_homologacao",
};
test("local SMTP is opt-in and never changes the default Brevo transport", () => {
  expect(localSmtpOptions({})).toBeNull();
  expect(localSmtpOptions(local)).toEqual({
    host: "127.0.0.1",
    port: 1025,
    secure: false,
    ignoreTLS: true,
  });
});
test.each([
  { NEXTAUTH_URL: "https://panteralab.example" },
  { MONGODB_URI: "mongodb://remote.example/panteralab_homologacao" },
  { MONGODB_URI: "mongodb://127.0.0.1:27027/production" },
  { MONGODB_URI: "mongodb://127.0.0.1:27017/panteralab_homologacao" },
  { PANTERALAB_HOMOLOGATION: "" },
  { VERCEL: "1" },
])("local SMTP rejects remote or ambiguous configuration %j", (override) => {
  expect(() => localSmtpOptions({ ...local, ...override })).toThrow(/isolado/);
});
