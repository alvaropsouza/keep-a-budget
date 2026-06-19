import { Injectable, Logger } from "@nestjs/common";
import { SessionRepository } from "../../repositories/session.repository";

@Injectable()
export class PurgeStaleSessionsUseCase {
  private readonly logger = new Logger(PurgeStaleSessionsUseCase.name);

  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(): Promise<number> {
    this.logger.log("PurgeStaleSessionsUseCase.execute");
    const deleted = await this.sessionRepository.purgeStale();
    this.logger.log({ deleted }, "PurgeStaleSessionsUseCase.execute done");
    return deleted;
  }
}
