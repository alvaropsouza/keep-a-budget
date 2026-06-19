import { Injectable, Logger } from "@nestjs/common";
import { SessionRepository } from "../../repositories/session.repository";
import type { SessionSummary } from "../../interfaces/auth";
import { hashToken } from "../../utils/auth-tokens";

export type ListSessionsInput = { userId: string; currentToken: string };

@Injectable()
export class ListSessionsUseCase {
  private readonly logger = new Logger(ListSessionsUseCase.name);

  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(input: ListSessionsInput): Promise<SessionSummary[]> {
    this.logger.log({ userId: input.userId }, "ListSessionsUseCase.execute");
    const sessions = await this.sessionRepository.findActiveByUserId(input.userId);
    const currentHash = hashToken(input.currentToken);
    const result = this.sessionRepository.mapToSummary(sessions, currentHash);
    this.logger.log({ userId: input.userId, count: result.length }, "ListSessionsUseCase.execute done");
    return result;
  }
}
