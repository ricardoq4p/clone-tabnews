import nodemailer from "nodemailer";
import { localSmtpOptions } from "./local-homologation";

export function createBrevoTransport() {
  const local = localSmtpOptions();
  if (local) return nodemailer.createTransport(local);
  return nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_USER,
      pass: process.env.BREVO_KEY,
    },
  });
}
