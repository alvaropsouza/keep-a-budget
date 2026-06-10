import { Injectable } from "@nestjs/common";
import { Resend } from "resend";
import logger from "../config/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "Keep a Budget <noreply@road-of-life.app>";
const APP_URL = process.env.APP_URL ?? "https://road-of-life.up.railway.app";

@Injectable()
export class EmailService {
  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    try {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Redefinir senha — Keep a Budget",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
            <h2 style="font-size:20px;font-weight:600;color:#111;margin-bottom:8px;">Redefinição de senha</h2>
            <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:24px;">
              Recebemos uma solicitação para redefinir a senha da sua conta.
              Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.
            </p>
            <a href="${resetUrl}"
               style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">
              Redefinir senha
            </a>
            <p style="color:#888;font-size:12px;margin-top:24px;line-height:1.6;">
              Se você não solicitou isso, ignore este email. Sua senha não será alterada.
            </p>
          </div>
        `,
      });
    } catch (err) {
      logger.error({ err, email }, "Failed to send password reset email");
      throw err;
    }
  }
}
