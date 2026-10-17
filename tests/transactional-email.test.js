import {
  buildVerificationEmailContent,
  buildPasswordResetEmailContent,
} from "@/lib/transactional-email";

describe("transactional email templates", () => {
  test("registration confirmation email includes user name, CTA, fallback link, and plain text", () => {
    const url = "https://panteralab.com.br/verify?token=abc123token";
    const result = buildVerificationEmailContent({
      user: { name: "Maria Clara" },
      url,
    });

    expect(result.subject).toBe("Confirme seu cadastro no PanteraLab");
    expect(result.html).toContain("Maria Clara");
    expect(result.html).toContain("Seja bem-vindo ao PanteraLab.");
    expect(result.html).toContain("CONFIRMAR MEU EMAIL");
    expect(result.html).toContain("Este link é válido por 24 horas.");
    expect(result.html).toContain(
      "Se você não criou uma conta no PanteraLab, pode ignorar esta mensagem.",
    );
    expect(result.html).toContain(`href="${url}"`);
    expect(result.html).toContain("max-width:600px");
    expect(result.html).toContain("#080B0A");
    expect(result.html).toContain("#00E85A");
    expect(result.html).not.toContain("<script");

    expect(result.text).toContain("Olá, Maria Clara!");
    expect(result.text).toContain("CONFIRMAR MEU EMAIL:");
    expect(result.text).toContain(url);
    expect(result.text).toContain("Este link é válido por 24 horas.");
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
    expect(result.html).toContain("Novo link para");
    expect(result.html).toContain("confirmar seu email.");
    expect(result.html).toContain("CONFIRMAR MEU EMAIL");
    expect(result.html).toContain(`href="${url}"`);
    expect(result.text).toContain("Novo link para confirmar seu email");
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
    expect(result.html).toContain("Redefinição");
    expect(result.html).toContain("REDEFINIR MINHA SENHA");
    expect(result.html).toContain(
      "Este link é válido por 30 minutos e pode ser utilizado apenas uma vez.",
    );
    expect(result.html).toContain(`href="${url}"`);
    expect(result.text).toContain("Olá, Fernanda!");
    expect(result.text).toContain("REDEFINIR MINHA SENHA:");
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
