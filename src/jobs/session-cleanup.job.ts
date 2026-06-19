import cron from "node-cron";
import logger from "../config/logger";
import { SessionRepository } from "../repositories/session.repository";
import { PurgeStaleSessionsUseCase } from "../use-cases/auth/purge-stale-sessions.use-case";

export class SessionCleanupJob {
  private purgeStaleSessionsUseCase: PurgeStaleSessionsUseCase;
  private task: ReturnType<typeof cron.schedule> | null = null;

  constructor() {
    this.purgeStaleSessionsUseCase = new PurgeStaleSessionsUseCase(new SessionRepository());
  }

  start(): void {
    if (this.task) {
      logger.warn("Session cleanup job is already running");
      return;
    }

    this.task = cron.schedule("30 3 * * *", async () => {
      try {
        logger.info("Running daily session cleanup");
        const deleted = await this.purgeStaleSessionsUseCase.execute();
        logger.info({ deleted }, "Daily session cleanup completed");
      } catch (error) {
        logger.error({ error }, "Error running daily session cleanup");
      }
    });

    logger.info("Session cleanup job started - will run daily at 03:30");
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info("Session cleanup job stopped");
    }
  }

  async runNow(): Promise<number> {
    logger.info("Manually triggering session cleanup");
    const deleted = await this.purgeStaleSessionsUseCase.execute();
    logger.info({ deleted }, "Manual session cleanup completed");
    return deleted;
  }
}

export const sessionCleanupJob = new SessionCleanupJob();
