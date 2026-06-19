import { Injectable, Logger } from "@nestjs/common";
import { SessionRepository } from "../../repositories/session.repository";
import { ResendService } from "../../services/resend.service";
import { AppError } from "../../utils/app-error";
import {
  normalizeEmail,
  createOtpCode,
  hashOtpCode,
  OTP_RESEND_COOLDOWN_MS,
} from "../../utils/auth-tokens";

export type RequestOtpInput = { email: string };

@Injectable()
export class RequestOtpUseCase {
  private readonly logger = new Logger(RequestOtpUseCase.name);

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly resendService: ResendService,
  ) {}

  async execute(input: RequestOtpInput): Promise<void> {
    this.logger.log({ email: input.email }, "RequestOtpUseCase.execute");

    const normalized = normalizeEmail(input.email);
    const user = await this.sessionRepository.findUserByEmail(normalized);
    if (!user) {
      this.logger.debug({ email: normalized }, "OTP requested for unknown email");
      return;
    }

    const latest = await this.sessionRepository.findLatestOtp(user.id);
    if (latest && Date.now() - latest.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      this.logger.warn({ userId: user.id }, "OTP resend blocked by cooldown");
      throw new AppError("Aguarde um instante antes de pedir outro código.", 429);
    }

    const code = createOtpCode();
    const codeHash = hashOtpCode(user.id, code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.sessionRepository.replaceOtp(user.id, codeHash, expiresAt);

    this.logger.log({ userId: user.id }, "OTP created, sending email");
    await this.resendService.sendLoginCode(user.email, code);

    this.logger.log({ userId: user.id }, "RequestOtpUseCase.execute done");
  }
}
