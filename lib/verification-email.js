import { createSecureToken, hashToken } from "./auth";
import { createBrevoTransport } from "./mailer";
import { buildVerificationEmailContent } from "./transactional-email";
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
export async function sendVerificationEmail(user, token, options = {}) {
  const url = new URL("/verify", process.env.NEXTAUTH_URL);
  url.searchParams.set("token", token);
  const { subject, html, text } = buildVerificationEmailContent({
    user,
    url: url.href,
    isResend: Boolean(options?.isResend),
  });
  await createBrevoTransport().sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject,
    html,
    text,
  });
}
