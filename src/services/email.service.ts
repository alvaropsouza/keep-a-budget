import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "Keep a Budget <noreply@road-of-life.app>";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendLoginCode(email: string, code: string): Promise<void> {
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: email,
        subject: `${code} é seu código de acesso — Keep a Budget`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
            <h2 style="font-size:20px;font-weight:600;color:#111;margin-bottom:8px;">Seu código de acesso</h2>
            <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:24px;">
              Use o código abaixo para entrar na sua conta. Ele expira em <strong>10 minutos</strong>.
            </p>
            <div style="display:inline-block;padding:16px 32px;background:#f4f4f5;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:8px;color:#18181b;">
              ${code}
            </div>
            <p style="color:#888;font-size:12px;margin-top:24px;line-height:1.6;">
              Se você não solicitou este código, ignore este email. Ninguém consegue acessar sua conta sem ele.
            </p>
          </div>
        `,
      });
      this.logger.log({ email, messageId: result.data?.id }, "Login code email sent");
    } catch (err) {
      this.logger.error({ err, email }, "Failed to send login code email");
      throw err;
    }
  }
}
