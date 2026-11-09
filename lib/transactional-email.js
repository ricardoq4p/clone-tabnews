import { escapeHtml } from "./validation";

const SITE_URL = "https://panteralab.com.br";
const SITE_DOMAIN = "panteralab.com.br";
const BRAND_DOVE_URL = `${SITE_URL}/brand/favicon-dove.png`;
const DEFAULT_VERIFICATION_TTL_MS = 86400000;

function normalizeDisplayName(name) {
  return typeof name === "string" ? name.trim() : "";
}

export function formatVerificationValidityLabel(ttlMs) {
  const raw = Number(
    ttlMs ??
      process.env.EMAIL_VERIFICATION_TOKEN_TTL_MS ??
      DEFAULT_VERIFICATION_TTL_MS,
  );
  const validMs =
    Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_VERIFICATION_TTL_MS;
  const hours = Math.round(validMs / 3600000);
  if (hours >= 1 && Math.abs(validMs - hours * 3600000) < 60000) {
    return hours === 1 ? "1 hora" : `${hours} horas`;
  }
  const minutes = Math.max(1, Math.round(validMs / 60000));
  return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
}

export function renderTransactionalLayout({
  preheader,
  badge,
  title,
  titleCream,
  titleGreen,
  userName,
  introLines = [],
  ctaLabel,
  ctaUrl,
  validityNote,
  securityNote,
}) {
  const resolvedTitle =
    title || [titleCream, titleGreen].filter(Boolean).join(" ").trim();
  const displayName = normalizeDisplayName(userName);
  const safeName = displayName ? escapeHtml(displayName) : "";
  const safeBadge = escapeHtml(badge || "CASA DE ORAÇÃO");
  const safeTitle = escapeHtml(resolvedTitle);
  const safeCtaLabel = escapeHtml(ctaLabel);
  const safeCtaUrl = escapeHtml(ctaUrl);
  const safeValidity = escapeHtml(validityNote);
  const safeSecurity = escapeHtml(securityNote);
  const safePreheader = escapeHtml(preheader || resolvedTitle);

  const greetingHtml = safeName
    ? `Olá, <strong style="color:#302016;font-weight:600;">${safeName}</strong>!`
    : "Olá!";

  const paragraphsHtml = introLines
    .map(
      (line) =>
        `<p style="margin:0 0 16px 0;color:#4A3B2F;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.75;">${escapeHtml(line)}</p>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${safeTitle} · PanteraLab</title>
</head>
<body bgcolor="#F7F1E8" style="margin:0;padding:0;background-color:#F7F1E8;color:#302016;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
    ${safePreheader}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F7F1E8" style="background-color:#F7F1E8;margin:0;padding:36px 14px;">
    <tr>
      <td align="center" bgcolor="#F7F1E8" style="padding:0;background-color:#F7F1E8;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" bgcolor="#FCF8F1" style="width:100%;max-width:600px;background-color:#FCF8F1;border:1px solid #E4D7C5;border-radius:16px;overflow:hidden;">
          <tr>
            <td bgcolor="#FCF8F1" style="background-color:#FCF8F1;padding:28px 36px 24px 36px;border-bottom:1px solid #E4D7C5;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td valign="middle" width="52" style="padding-right:14px;">
                    <img src="${BRAND_DOVE_URL}" width="42" height="42" alt="PanteraLab" style="display:block;width:42px;height:42px;border:1px solid #D8C19A;border-radius:999px;background-color:#FCF8F1;color:#7C5828;font-family:Georgia,'Times New Roman',Times,serif;font-size:12px;text-align:center;line-height:42px;" />
                  </td>
                  <td valign="middle">
                    <div style="font-family:Georgia,'Times New Roman',Times,serif;font-size:24px;font-weight:400;color:#302016;letter-spacing:-0.4px;line-height:1.15;">
                      PanteraLab
                    </div>
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:600;color:#7C5828;letter-spacing:2.2px;text-transform:uppercase;margin-top:4px;">
                      Casa de Oração
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td bgcolor="#FCF8F1" style="padding:36px 36px 32px 36px;background-color:#FCF8F1;color:#302016;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.75;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:#7C5828;margin-bottom:12px;">
                ${safeBadge}
              </div>
              <h1 style="margin:0 0 22px 0;font-family:Georgia,'Times New Roman',Times,serif;font-size:28px;font-weight:400;line-height:1.25;letter-spacing:-0.4px;color:#302016;">
                ${safeTitle}
              </h1>
              <p style="margin:0 0 16px 0;color:#302016;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.75;">
                ${greetingHtml}
              </p>
              ${paragraphsHtml}
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 28px 0;">
                <tr>
                  <td align="center" bgcolor="#4A2B18" style="background-color:#4A2B18;border-radius:999px;">
                    <a href="${safeCtaUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;line-height:1.4;letter-spacing:0.2px;color:#FFF8EE;background-color:#4A2B18;border:1px solid #4A2B18;border-radius:999px;text-decoration:none;">
                      ${safeCtaLabel}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#6E5E4F;">
                <strong style="color:#7C5828;font-weight:600;">Validade:</strong> ${safeValidity}
              </p>
              <div style="padding-top:22px;border-top:1px solid #E4D7C5;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#6E5E4F;">
                <p style="margin:0 0 8px 0;color:#6E5E4F;">
                  Caso o botão acima não funcione no seu aplicativo de e-mail, copie e acesse o link abaixo no navegador:
                </p>
                <p style="margin:0 0 18px 0;word-break:break-all;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;">
                  <a href="${safeCtaUrl}" target="_blank" rel="noopener noreferrer" style="color:#7C5828;text-decoration:underline;">${safeCtaUrl}</a>
                </p>
                <p style="margin:0;color:#6E5E4F;font-size:13px;line-height:1.65;">
                  ${safeSecurity}
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td bgcolor="#F3EADC" style="background-color:#F3EADC;border-top:1px solid #E4D7C5;padding:24px 36px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#6E5E4F;">
              <div style="font-family:Georgia,'Times New Roman',Times,serif;font-size:15px;font-weight:400;color:#302016;">
                PanteraLab <span style="color:#9B7540;">·</span> Casa de Oração
              </div>
              <div style="margin-top:4px;">
                <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer" style="color:#7C5828;font-weight:600;text-decoration:none;">${SITE_DOMAIN}</a>
              </div>
              <div style="margin-top:6px;font-size:12px;color:#6E5E4F;">
                Um espaço de silêncio, oração e vida comunitária · Mensagem automática transacional.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderTransactionalText({
  heading,
  userName,
  introLines = [],
  ctaLabel,
  ctaUrl,
  validityNote,
  securityNote,
}) {
  const displayName = normalizeDisplayName(userName);
  const greeting = displayName ? `Olá, ${displayName}!` : "Olá!";
  return [
    "PanteraLab · Casa de Oração",
    "----------------------------------------",
    "",
    heading,
    "",
    greeting,
    "",
    ...introLines.flatMap((line) => [line, ""]),
    `${ctaLabel}:`,
    ctaUrl,
    "",
    validityNote,
    "",
    securityNote,
    "",
    "--",
    "PanteraLab · Casa de Oração",
    SITE_DOMAIN,
    SITE_URL,
  ].join("\n");
}

export function buildVerificationEmailContent({
  user,
  url,
  isResend = false,
  ttlMs,
}) {
  const userName = user?.name;
  const validityDuration = formatVerificationValidityLabel(ttlMs);
  if (isResend) {
    const title = "Novo link para confirmar seu e-mail";
    const introLines = [
      "Recebemos sua solicitação de um novo link de confirmação para o PanteraLab · Casa de Oração.",
      "Para concluir seu cadastro e ativar o acesso à sua conta, confirme seu endereço de e-mail utilizando o botão abaixo.",
    ];
    const validityNote = `Este link é válido por ${validityDuration} e substitui os links enviados anteriormente.`;
    const securityNote =
      "Se você não solicitou este novo link no PanteraLab, nenhuma ação é necessária e você pode ignorar esta mensagem.";
    return {
      subject: "Confirme seu cadastro no PanteraLab",
      html: renderTransactionalLayout({
        preheader:
          "Novo link para confirmar seu endereço de e-mail no PanteraLab · Casa de Oração.",
        badge: "CASA DE ORAÇÃO · CONFIRMAÇÃO DE CONTA",
        title,
        userName,
        introLines,
        ctaLabel: "Confirmar meu e-mail",
        ctaUrl: url,
        validityNote,
        securityNote,
      }),
      text: renderTransactionalText({
        heading: title,
        userName,
        introLines,
        ctaLabel: "Confirmar meu e-mail",
        ctaUrl: url,
        validityNote,
        securityNote,
      }),
    };
  }

  const title = "Seja bem-vindo ao PanteraLab";
  const introLines = [
    "É uma alegria acolher você em nossa Casa de Oração — um espaço de silêncio, intercessão e comunhão para caminhar na fé.",
    "Para concluir seu cadastro e ativar o acesso à sua conta, confirme seu endereço de e-mail pelo botão abaixo.",
  ];
  const validityNote = `Este link é válido por ${validityDuration}.`;
  const securityNote =
    "Se você não realizou este cadastro no PanteraLab, nenhuma ação é necessária — você pode ignorar esta mensagem com tranquilidade.";

  return {
    subject: "Confirme seu cadastro no PanteraLab",
    html: renderTransactionalLayout({
      preheader:
        "Seja bem-vindo ao PanteraLab · Casa de Oração. Confirme seu endereço de e-mail para concluir seu cadastro.",
      badge: "CASA DE ORAÇÃO · CONFIRMAÇÃO DE CADASTRO",
      title,
      userName,
      introLines,
      ctaLabel: "Confirmar meu e-mail",
      ctaUrl: url,
      validityNote,
      securityNote,
    }),
    text: renderTransactionalText({
      heading: title,
      userName,
      introLines,
      ctaLabel: "Confirmar meu e-mail",
      ctaUrl: url,
      validityNote,
      securityNote,
    }),
  };
}

export function buildPasswordResetEmailContent({ user, url }) {
  const userName = user?.name;
  const title = "Redefinição de senha";
  const introLines = [
    "Recebemos uma solicitação para redefinir a senha da sua conta no PanteraLab · Casa de Oração.",
    "Para escolher uma nova senha com segurança, utilize o botão abaixo.",
  ];
  const validityNote =
    "Este link é válido por 30 minutos e pode ser utilizado apenas uma vez.";
  const securityNote =
    "Se você não solicitou a alteração de senha, nenhuma mudança foi realizada. Você pode ignorar esta mensagem com tranquilidade.";

  return {
    subject: "Redefina sua senha no PanteraLab",
    html: renderTransactionalLayout({
      preheader:
        "Solicitação de redefinição de senha da sua conta no PanteraLab · Casa de Oração.",
      badge: "CASA DE ORAÇÃO · SEGURANÇA DA CONTA",
      title,
      userName,
      introLines,
      ctaLabel: "Redefinir minha senha",
      ctaUrl: url,
      validityNote,
      securityNote,
    }),
    text: renderTransactionalText({
      heading: title,
      userName,
      introLines,
      ctaLabel: "Redefinir minha senha",
      ctaUrl: url,
      validityNote,
      securityNote,
    }),
  };
}
