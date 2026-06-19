import cron from "node-cron";
import logger from "../config/logger";
import { AuthService } from "../services/auth.service";

export class SessionCleanupJob {
  private authService: AuthService;
  private task: ReturnType<typeof cron.schedule> | null = null;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Starts the daily job that purges expired and old revoked sessions,
   * keeping the user_sessions table from growing unbounded.
   * Runs every day at 03:30.
   */
  start(): void {
    if (this.task) {
      logger.warn("Session cleanup job is already running");
      return;
    }

    // "30 3 * * *" = At 03:30 every day
    this.task = cron.schedule("30 3 * * *", async () => {
      try {
        logger.info("Running daily session cleanup");
        const deleted = await this.authService.purgeStaleSessions();
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

  /**
   * Manually trigger the cleanup. Useful for testing or manual execution.
   */
  async runNow(): Promise<number> {
    logger.info("Manually triggering session cleanup");
    const deleted = await this.authService.purgeStaleSessions();
    logger.info({ deleted }, "Manual session cleanup completed");
    return deleted;
  }
}

export const sessionCleanupJob = new SessionCleanupJob();
