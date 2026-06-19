import { Injectable, Logger } from "@nestjs/common";
import { SessionRepository } from "../../repositories/session.repository";

export type RevokeSessionInput = { userId: string; sessionId: string };

@Injectable()
export class RevokeSessionUseCase {
  private readonly logger = new Logger(RevokeSessionUseCase.name);

  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(input: RevokeSessionInput): Promise<boolean> {
    this.logger.log({ userId: input.userId, sessionId: input.sessionId }, "RevokeSessionUseCase.execute");
    const revoked = await this.sessionRepository.revokeById(input.userId, input.sessionId);
    this.logger.log({ revoked }, "RevokeSessionUseCase.execute done");
    return revoked;
  }
}
