import { hash } from "bcryptjs";
import connectToDatabase from "../../../lib/db";
import User from "../../../lib/models/User";
import { getRoleForEmail, isSuperadminEmail, normalizeEmail } from "@/lib/auth";
import { createBrevoTransport } from "@/lib/mailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  try {
    const { email, password, name } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password || !name) {
      return res
        .status(400)
        .json({ error: "Todos os campos sao obrigatorios" });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: "Email ja cadastrado" });
    }

    const hashedPassword = await hash(password, 12);
    const verificationToken =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const username = normalizedEmail.split("@")[0];
    const isSuperadmin = isSuperadminEmail(normalizedEmail);

    await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      name,
      username,
      role: getRoleForEmail(normalizedEmail),
      verificationToken,
      isVerified: isSuperadmin,
    });

    if (!isSuperadmin) {
      const transporter = createBrevoTransport();

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: normalizedEmail,
        subject: "Confirme seu cadastro",
        html: `
          <h2>Ola ${name}!</h2>
          <p>Clique no link abaixo para confirmar seu email:</p>
          <a href="${process.env.NEXTAUTH_URL}/verify?token=${verificationToken}">
            Confirmar email
          </a>
          <p>Link valido por 24 horas.</p>
        `,
      });
    }

    res.status(201).json({
      message: isSuperadmin
        ? "Superusuario criado com acesso liberado."
        : "Cadastro realizado! Verifique seu email para confirmar.",
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}
