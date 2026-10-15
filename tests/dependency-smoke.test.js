import nodemailer from "nodemailer";
import sharp from "sharp";
import path from "path";
test("the patched mailer renders a UTF-8 verification-style message without a network connection", async () => {
  const transport = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: "unix",
  });
  const result = await transport.sendMail({
    from: "PanteraLab <qa@example.test>",
    to: "participante@example.test",
    subject: "Confirmação de conta — teste local",
    html: "<p>Confirme sua conta de teste.</p>",
  });
  expect(Buffer.isBuffer(result.message)).toBe(true);
  expect(result.message.toString()).toContain("Subject:");
  expect(result.envelope.to).toEqual(["participante@example.test"]);
  transport.close();
});
test("the patched image dependency can render the local devotional artwork", async () => {
  const result = await sharp(
    path.join(process.cwd(), "public/sacred/oratorio.svg"),
  )
    .resize(120)
    .png()
    .toBuffer({ resolveWithObject: true });
  expect(result.info.format).toBe("png");
  expect(result.info.width).toBe(120);
  expect(result.data.length).toBeGreaterThan(100);
});
