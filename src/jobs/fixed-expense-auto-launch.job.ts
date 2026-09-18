import type { ScheduledTask } from "node-cron" with { "resolution-mode": "import" };
import logger from "../config/logger";
import { FixedExpenseRepository } from "../repositories/fixed-expense.repository";
import { ExpenseRepository } from "../repositories/expense.repository";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { AutoLaunchFixedExpensesUseCase } from "../use-cases/fixed-expenses/auto-launch-fixed-expenses.use-case";
import { APP_TIMEZONE } from "../utils/timezone";

export class FixedExpenseAutoLaunchJob {
  private autoLaunchFixedExpensesUseCase: AutoLaunchFixedExpensesUseCase;
  private task: ScheduledTask | null = null;

  constructor() {
    this.autoLaunchFixedExpensesUseCase = new AutoLaunchFixedExpensesUseCase(
      new FixedExpenseRepository(),
      new ExpenseRepository(),
      new InvoiceRepository(),
      new CategoryRepository(),
    );
  }

  async start(): Promise<void> {
    if (this.task) {
      logger.warn("Fixed expense auto-launch job is already running");
      return;
    }

    const cron = await import("node-cron");
    this.task = cron.schedule(
      "20 0 * * *",
      async () => {
        try {
          logger.info("Running daily fixed expense auto-launch");
          const result = await this.autoLaunchFixedExpensesUseCase.execute();
          logger.info(result, "Daily fixed expense auto-launch completed");
        } catch (error) {
          logger.error({ error }, "Error running daily fixed expense auto-launch");
        }
      },
      { timezone: APP_TIMEZONE },
    );

    logger.info("Fixed expense auto-launch job started - will run daily at 00:20 (BRT)");
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info("Fixed expense auto-launch job stopped");
    }
  }

  async runNow(): Promise<void> {
    logger.info("Manually triggering fixed expense auto-launch");
    const result = await this.autoLaunchFixedExpensesUseCase.execute();
    logger.info(result, "Manual fixed expense auto-launch completed");
  }
}

export const fixedExpenseAutoLaunchJob = new FixedExpenseAutoLaunchJob();
