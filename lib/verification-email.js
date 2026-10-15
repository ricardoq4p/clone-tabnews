import { createSecureToken, hashToken } from "./auth";
import { createBrevoTransport } from "./mailer";
import { escapeHtml } from "./validation";
export function createVerification() {
  const token = createSecureToken();
  return {
    token,
    fields: {
      verificationToken: hashToken(token),
      verificationTokenExpires: new Date(
        Date.now() +
          Number(process.env.EMAIL_VERIFICATION_TOKEN_TTL_MS || 86400000),
      ),
    },
  };
}
export async function sendVerificationEmail(user, token) {
  const url = new URL("/verify", process.env.NEXTAUTH_URL);
  url.searchParams.set("token", token);
  await createBrevoTransport().sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Confirme seu cadastro",
    html: `<h2>Ola ${escapeHtml(user.name)}!</h2><p>Confirme seu cadastro:</p><a href="${escapeHtml(url.href)}">Confirmar email</a><p>Se o link expirar, solicite um novo na pagina de acesso.</p>`,
  });
}
