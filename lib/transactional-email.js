import { escapeHtml } from "./validation";

const SITE_URL = "https://panteralab.com.br";

function normalizeDisplayName(name) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return trimmed || "usuário";
}

export function renderTransactionalLayout({
  preheader,
  badge,
  titleCream,
  titleGreen,
  userName,
  introLines,
  ctaLabel,
  ctaUrl,
  validityNote,
  securityNote,
}) {
  const safeName = escapeHtml(normalizeDisplayName(userName));
  const safeBadge = escapeHtml(badge);
  const safeTitleCream = escapeHtml(titleCream);
  const safeTitleGreen = escapeHtml(titleGreen);
  const safeCtaLabel = escapeHtml(ctaLabel);
  const safeCtaUrl = escapeHtml(ctaUrl);
  const safeValidity = escapeHtml(validityNote);
  const safeSecurity = escapeHtml(securityNote);
  const safePreheader = escapeHtml(preheader || `${titleCream} ${titleGreen}`);
  const paragraphsHtml = introLines
    .map(
      (line) =>
        `<p style="margin:0 0 16px 0;color:#A7C4BC;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;">${escapeHtml(line)}</p>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${safeTitleCream} ${safeTitleGreen} · PanteraLab</title>
</head>
<body bgcolor="#080B0A" style="margin:0;padding:0;background-color:#080B0A;color:#F2EAD5;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
    ${safePreheader}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#080B0A" style="background-color:#080B0A;margin:0;padding:28px 12px;">
    <tr>
      <td align="center" bgcolor="#080B0A" style="padding:0;background-color:#080B0A;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" bgcolor="#101613" style="width:100%;max-width:600px;background-color:#101613;border:1px solid #254A36;border-radius:2px;overflow:hidden;">
          <tr>
            <td bgcolor="#080B0A" style="background-color:#080B0A;padding:24px 32px;border-bottom:1px solid #254A36;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td valign="middle" width="48" style="padding-right:14px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="36" height="38" bgcolor="#080B0A" style="border:1px solid #254A36;background-color:#080B0A;">
                      <tr>
                        <td align="center" valign="middle" style="color:#FFB84D;font-family:'Courier New',Courier,monospace;font-size:20px;font-weight:bold;line-height:36px;">
                          &#10013;
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle">
                    <div style="font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:700;color:#00E85A;letter-spacing:0.5px;line-height:1.1;">
                      PanteraLab
                    </div>
                    <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#A7C4BC;letter-spacing:2.4px;text-transform:uppercase;margin-top:5px;">
                      CASA DE ORAÇÃO
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td bgcolor="#101613" style="padding:36px 32px 30px 32px;background-color:#101613;color:#F2EAD5;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;">
              <div style="font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FFB84D;margin-bottom:12px;">
                ${safeBadge}
              </div>
              <h1 style="margin:0 0 22px 0;font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:700;line-height:1.25;color:#F2EAD5;">
                ${safeTitleCream}<br />
                <span style="color:#00E85A;">${safeTitleGreen}</span>
              </h1>
              <p style="margin:0 0 14px 0;color:#F2EAD5;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;">
                Olá, <strong style="color:#00E85A;">${safeName}</strong>!
              </p>
              ${paragraphsHtml}
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 26px 0;">
                <tr>
                  <td align="center" bgcolor="#00E85A" style="background-color:#00E85A;border:1px solid #00E85A;border-radius:2px;">
                    <a href="${safeCtaUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:700;letter-spacing:1.2px;color:#080B0A;background-color:#00E85A;text-decoration:none;text-transform:uppercase;">
                      ${safeCtaLabel}
                    </a>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#17241B" style="margin:0 0 24px 0;background-color:#17241B;border:1px solid #254A36;border-left:3px solid #FFB84D;">
                <tr>
                  <td style="padding:12px 16px;font-family:'Courier New',Courier,monospace;font-size:13px;line-height:1.55;color:#F2EAD5;">
                    <strong style="color:#FFB84D;">PRAZO:</strong> ${safeValidity}
                  </td>
                </tr>
              </table>
              <div style="padding-top:20px;border-top:1px solid #254A36;font-size:13px;line-height:1.6;color:#A7C4BC;">
                <p style="margin:0 0 8px 0;color:#A7C4BC;">
                  Caso o botão acima não funcione no seu leitor de email, copie e cole o endereço abaixo no navegador:
                </p>
                <p style="margin:0 0 18px 0;word-break:break-all;font-family:'Courier New',Courier,monospace;font-size:12px;background-color:#080B0A;border:1px solid #254A36;padding:10px 12px;">
                  <a href="${safeCtaUrl}" target="_blank" rel="noopener noreferrer" style="color:#00E85A;text-decoration:underline;">${safeCtaUrl}</a>
                </p>
                <p style="margin:0;color:#A7C4BC;font-size:13px;">
                  ${safeSecurity}
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td bgcolor="#080B0A" style="background-color:#080B0A;border-top:1px solid #254A36;padding:20px 32px;text-align:center;font-family:'Courier New',Courier,monospace;font-size:12px;line-height:1.6;color:#A7C4BC;">
              <div style="font-weight:700;color:#F2EAD5;">
                PanteraLab <span style="color:#FFB84D;">·</span> Casa de Oração
              </div>
              <div style="margin-top:4px;">
                <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer" style="color:#00E85A;text-decoration:none;">${SITE_URL}</a>
              </div>
              <div style="margin-top:6px;font-size:11px;color:#6B756E;">
                Mensagem automática transacional · Não é necessário responder a este email.
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
  introLines,
  ctaLabel,
  ctaUrl,
  validityNote,
  securityNote,
}) {
  const displayName = normalizeDisplayName(userName);
  return [
    "PanteraLab · Casa de Oração",
    "========================================",
    "",
    heading,
    "",
    `Olá, ${displayName}!`,
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
    SITE_URL,
  ].join("\n");
}

export function buildVerificationEmailContent({ user, url, isResend = false }) {
  const userName = user?.name;
  if (isResend) {
    const introLines = [
      "Recebemos sua solicitação de um novo link de confirmação no PanteraLab.",
      "Para concluir seu cadastro e ativar o acesso à sua conta, confirme seu endereço de email utilizando o botão abaixo.",
    ];
    const validityNote =
      "Este link é válido por 24 horas e substitui links enviados anteriormente.";
    const securityNote =
      "Se você não solicitou este novo link no PanteraLab, pode ignorar esta mensagem.";
    return {
      subject: "Confirme seu cadastro no PanteraLab",
      html: renderTransactionalLayout({
        preheader:
          "Novo link para confirmar seu endereço de email no PanteraLab.",
        badge: "CASA DE ORAÇÃO · CONFIRMAÇÃO DE CONTA",
        titleCream: "Novo link para",
        titleGreen: "confirmar seu email.",
        userName,
        introLines,
        ctaLabel: "CONFIRMAR MEU EMAIL",
        ctaUrl: url,
        validityNote,
        securityNote,
      }),
      text: renderTransactionalText({
        heading: "Novo link para confirmar seu email",
        userName,
        introLines,
        ctaLabel: "CONFIRMAR MEU EMAIL",
        ctaUrl: url,
        validityNote,
        securityNote,
      }),
    };
  }

  const introLines = [
    "Seja bem-vindo ao PanteraLab.",
    "Para concluir seu cadastro e acessar sua conta, confirme seu endereço de email utilizando o botão abaixo.",
  ];
  const validityNote = "Este link é válido por 24 horas.";
  const securityNote =
    "Se você não criou uma conta no PanteraLab, pode ignorar esta mensagem.";

  return {
    subject: "Confirme seu cadastro no PanteraLab",
    html: renderTransactionalLayout({
      preheader:
        "Seja bem-vindo ao PanteraLab. Confirme seu endereço de email para acessar sua conta.",
      badge: "UM LUGAR PARA A SUA FÉ · CADASTRO",
      titleCream: "Confirme seu",
      titleGreen: "endereço de email.",
      userName,
      introLines,
      ctaLabel: "CONFIRMAR MEU EMAIL",
      ctaUrl: url,
      validityNote,
      securityNote,
    }),
    text: renderTransactionalText({
      heading: "Confirme seu endereço de email",
      userName,
      introLines,
      ctaLabel: "CONFIRMAR MEU EMAIL",
      ctaUrl: url,
      validityNote,
      securityNote,
    }),
  };
}

export function buildPasswordResetEmailContent({ user, url }) {
  const userName = user?.name;
  const introLines = [
    "Recebemos uma solicitação para redefinir a senha da sua conta no PanteraLab.",
    "Para criar uma nova senha com segurança, utilize o botão abaixo.",
  ];
  const validityNote =
    "Este link é válido por 30 minutos e pode ser utilizado apenas uma vez.";
  const securityNote =
    "Se você não solicitou a alteração de senha, nenhuma mudança foi realizada. Você pode ignorar esta mensagem.";

  return {
    subject: "Redefina sua senha no PanteraLab",
    html: renderTransactionalLayout({
      preheader:
        "Solicitação de redefinição de senha da sua conta no PanteraLab.",
      badge: "CASA DE ORAÇÃO · SEGURANÇA DA CONTA",
      titleCream: "Redefinição",
      titleGreen: "de senha.",
      userName,
      introLines,
      ctaLabel: "REDEFINIR MINHA SENHA",
      ctaUrl: url,
      validityNote,
      securityNote,
    }),
    text: renderTransactionalText({
      heading: "Redefinição de senha",
      userName,
      introLines,
      ctaLabel: "REDEFINIR MINHA SENHA",
      ctaUrl: url,
      validityNote,
      securityNote,
    }),
  };
}
