import { Injectable, Logger } from "@nestjs/common";
import { SessionRepository } from "../../repositories/session.repository";
import { hashToken } from "../../utils/auth-tokens";

export type LogoutInput = { token: string | null | undefined };

@Injectable()
export class LogoutUseCase {
  private readonly logger = new Logger(LogoutUseCase.name);

  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(input: LogoutInput): Promise<void> {
    if (!input.token) return;
    this.logger.log("LogoutUseCase.execute");
    const tokenHash = hashToken(input.token);
    await this.sessionRepository.revokeByTokenHash(tokenHash);
    this.logger.log("LogoutUseCase.execute done");
  }
}
