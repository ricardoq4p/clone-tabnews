import { serverIntegrationEnabled } from "./integration-policy";
import nodemailer from "nodemailer";
import { localSmtpOptions } from "./local-homologation";

export function createBrevoTransport() {
  if (!serverIntegrationEnabled("email"))
    throw new Error("Envio de emails desativado neste ambiente.");
  const local = localSmtpOptions();
  if (local) return nodemailer.createTransport(local);
  if (
    !process.env.BREVO_USER ||
    !process.env.BREVO_KEY ||
    !process.env.EMAIL_FROM
  )
    throw new Error("Envio de emails indisponível neste ambiente.");
  return nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.BREVO_USER,
      pass: process.env.BREVO_KEY,
    },
  });
}
