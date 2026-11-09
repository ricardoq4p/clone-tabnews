import {
  buildVerificationEmailContent,
  buildPasswordResetEmailContent,
  formatVerificationValidityLabel,
} from "@/lib/transactional-email";

describe("transactional email templates", () => {
  test("registration confirmation email follows editorial visual identity, structure, CTA, and plain text", () => {
    const url = "https://panteralab.com.br/verify?token=abc123token";
    const result = buildVerificationEmailContent({
      user: { name: "Maria Clara" },
      url,
    });

    expect(result.subject).toBe("Confirme seu cadastro no PanteraLab");
    expect(result.html).toContain("PanteraLab");
    expect(result.html).toContain("Casa de Oração");
    expect(result.html).toContain(
      "https://panteralab.com.br/brand/favicon-dove.png",
    );
    expect(result.html).toContain("Seja bem-vindo ao PanteraLab");
    expect(result.html).toContain("Maria Clara");
    expect(result.html).toContain("Confirmar meu e-mail");
    expect(result.html).toContain("Este link é válido por 24 horas.");
    expect(result.html).toContain(
      "Se você não realizou este cadastro no PanteraLab, nenhuma ação é necessária",
    );
    expect(result.html).toContain(`href="${url}"`);
    expect(result.html).toContain("panteralab.com.br");
    expect(result.html).toContain("max-width:600px");

    // Current editorial light palette from styles/identity.css
    expect(result.html).toContain("#F7F1E8");
    expect(result.html).toContain("#FCF8F1");
    expect(result.html).toContain("#302016");
    expect(result.html).toContain("#4A2B18");
    expect(result.html).toContain("#7C5828");
    expect(result.html).toContain("Georgia");

    // Legacy terminal/neon palette must not appear
    expect(result.html).not.toContain("#080B0A");
    expect(result.html).not.toContain("#00E85A");
    expect(result.html).not.toContain("Courier New");
    expect(result.html).not.toContain("<script");

    expect(result.text).toContain("Seja bem-vindo ao PanteraLab");
    expect(result.text).toContain("Olá, Maria Clara!");
    expect(result.text).toContain("Confirmar meu e-mail:");
    expect(result.text).toContain(url);
    expect(result.text).toContain("Este link é válido por 24 horas.");
    expect(result.text).toContain("panteralab.com.br");
  });

  test("registration confirmation email handles missing user name gracefully and respects configured TTL", () => {
    const url = "https://panteralab.com.br/verify?token=noname123";
    const result = buildVerificationEmailContent({
      user: {},
      url,
      ttlMs: 12 * 3600 * 1000,
    });

    expect(result.html).toContain("Olá!");
    expect(result.html).not.toContain("Olá, usuário!");
    expect(result.html).toContain("Este link é válido por 12 horas.");
    expect(result.text).toContain("Olá!");
    expect(result.text).toContain("Este link é válido por 12 horas.");
    expect(formatVerificationValidityLabel(86400000)).toBe("24 horas");
  });

  test("resend confirmation email adapts heading and validity copy while preserving CTA", () => {
    const url = "https://panteralab.com.br/verify?token=resend456";
    const result = buildVerificationEmailContent({
      user: { name: "João Pedro" },
      url,
      isResend: true,
    });

    expect(result.subject).toBe("Confirme seu cadastro no PanteraLab");
    expect(result.html).toContain("João Pedro");
    expect(result.html).toContain("Novo link para confirmar seu e-mail");
    expect(result.html).toContain("Confirmar meu e-mail");
    expect(result.html).toContain(`href="${url}"`);
    expect(result.text).toContain("Novo link para confirmar seu e-mail");
    expect(result.text).toContain(url);
  });

  test("password reset email includes 30-minute validity, reset CTA, and plain text", () => {
    const url = "https://panteralab.com.br/reset-password?token=reset789";
    const result = buildPasswordResetEmailContent({
      user: { name: "Fernanda" },
      url,
    });

    expect(result.subject).toBe("Redefina sua senha no PanteraLab");
    expect(result.html).toContain("Fernanda");
    expect(result.html).toContain("Redefinição de senha");
    expect(result.html).toContain("Redefinir minha senha");
    expect(result.html).toContain(
      "Este link é válido por 30 minutos e pode ser utilizado apenas uma vez.",
    );
    expect(result.html).toContain(`href="${url}"`);
    expect(result.text).toContain("Olá, Fernanda!");
    expect(result.text).toContain("Redefinir minha senha:");
    expect(result.text).toContain(url);
  });

  test("dynamic user name and URL are properly escaped against HTML injection", () => {
    const result = buildVerificationEmailContent({
      user: { name: '<script>alert("xss")</script> & "Admin"' },
      url: 'https://panteralab.com.br/verify?token=1&extra="quote"',
    });

    expect(result.html).not.toContain('<script>alert("xss")</script>');
    expect(result.html).toContain(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &quot;Admin&quot;",
    );
    expect(result.html).toContain(
      "https://panteralab.com.br/verify?token=1&amp;extra=&quot;quote&quot;",
    );
  });
});
