import { Injectable, Logger } from "@nestjs/common";
import { SessionRepository } from "../../repositories/session.repository";
import { hashToken } from "../../utils/auth-tokens";

export type RevokeOtherSessionsInput = { userId: string; currentToken: string };

@Injectable()
export class RevokeOtherSessionsUseCase {
  private readonly logger = new Logger(RevokeOtherSessionsUseCase.name);

  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(input: RevokeOtherSessionsInput): Promise<number> {
    this.logger.log({ userId: input.userId }, "RevokeOtherSessionsUseCase.execute");
    const currentHash = hashToken(input.currentToken);
    const revoked = await this.sessionRepository.revokeOthers(input.userId, currentHash);
    this.logger.log({ revoked }, "RevokeOtherSessionsUseCase.execute done");
    return revoked;
  }
}
