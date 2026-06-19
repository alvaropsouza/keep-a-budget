import { Injectable, Logger } from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";
import { SessionRepository } from "../../repositories/session.repository";
import { AppError } from "../../utils/app-error";
import type { AuthSession, SessionContext } from "../../interfaces/auth";
import {
  normalizeEmail,
  buildUserName,
  hashToken,
  createSessionToken,
  hashOtpCode,
  getSessionExpiryDate,
  deviceIdFrom,
  OTP_MAX_ATTEMPTS,
} from "../../utils/auth-tokens";

export type VerifyOtpInput = { email: string; code: string; context?: SessionContext };

@Injectable()
export class VerifyOtpUseCase {
  private readonly logger = new Logger(VerifyOtpUseCase.name);

  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(input: VerifyOtpInput): Promise<AuthSession> {
    this.logger.log({ email: input.email }, "VerifyOtpUseCase.execute");

    const invalidCode = (): never => {
      throw new AppError("Código inválido ou expirado.", 401);
    };

    const normalized = normalizeEmail(input.email);
    const user = await this.sessionRepository.findUserByEmail(normalized);
    if (!user) invalidCode();

    const otp = await this.sessionRepository.findLatestOtp(user!.id);

    if (
      !otp ||
      otp.consumedAt ||
      otp.expiresAt.getTime() <= Date.now() ||
      otp.attempts >= OTP_MAX_ATTEMPTS
    ) {
      invalidCode();
    }

    const providedHash = Buffer.from(hashOtpCode(user!.id, input.code), "hex");
    const storedHash = Buffer.from(otp!.codeHash, "hex");
    const matches =
      providedHash.length === storedHash.length && timingSafeEqual(providedHash, storedHash);

    if (!matches) {
      await this.sessionRepository.incrementOtpAttempts(otp!.id);
      this.logger.warn(
        { userId: user!.id, attempts: otp!.attempts + 1 },
        "OTP verification failed: wrong code",
      );
      invalidCode();
    }

    await this.sessionRepository.consumeOtp(otp!.id);

    const sessionToken = createSessionToken();
    const tokenHash = hashToken(sessionToken);
    const expiresAt = getSessionExpiryDate();

    await this.sessionRepository.upsertSession({
      userId: user!.id,
      tokenHash,
      deviceId: deviceIdFrom(input.context),
      expiresAt,
      userAgent: input.context?.userAgent ?? null,
      ipAddress: input.context?.ipAddress ?? null,
    });

    await this.sessionRepository.updateUserLastLogin(user!.id);

    this.logger.log({ userId: user!.id }, "VerifyOtpUseCase.execute done");

    return {
      user: {
        userId: user!.id,
        email: user!.email,
        name: buildUserName(user!.name, user!.lastName),
      },
      expiresAt,
      sessionToken,
    };
  }
}
