import { hash } from "bcryptjs";
import connectToDatabase from "../../lib/db";
import User from "../../lib/models/User";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios" });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email já cadastrado" });
    }

    const hashedPassword = await hash(password, 12);

    const verificationToken =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      verificationToken,
      isVerified: false,
    });

    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_KEY,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Confirme seu cadastro",
      html: `
        <h2>Olá ${name}!</h2>
        <p>Clique no link abaixo para confirmar seu email:</p>
        <a href="${process.env.NEXTAUTH_URL}/verify?token=${verificationToken}">
          Confirmar email
        </a>
        <p>Link válido por 24 horas.</p>
      `,
    });

    res.status(201).json({
      message: "Cadastro realizado! Verifique seu email para confirmar.",
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}
