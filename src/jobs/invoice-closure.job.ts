import cron from "node-cron";
import logger from "../config/logger";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { CloseInvoiceUseCase } from "../use-cases/invoices/close-invoice.use-case";
import { CloseExpiredInvoicesUseCase } from "../use-cases/invoices/close-expired-invoices.use-case";
import { APP_TIMEZONE } from "../utils/timezone";

export class InvoiceClosureJob {
  private closeExpiredInvoicesUseCase: CloseExpiredInvoicesUseCase;
  private task: ReturnType<typeof cron.schedule> | null = null;

  constructor() {
    const invoiceRepository = new InvoiceRepository();
    const closeInvoiceUseCase = new CloseInvoiceUseCase(invoiceRepository);
    this.closeExpiredInvoicesUseCase = new CloseExpiredInvoicesUseCase(invoiceRepository, closeInvoiceUseCase);
  }

  start(): void {
    if (this.task) {
      logger.warn("Invoice closure job is already running");
      return;
    }

    this.task = cron.schedule(
      "5 0 * * *",
      async () => {
        try {
          logger.info("Running daily invoice closure check");
          const result = await this.closeExpiredInvoicesUseCase.execute();
          logger.info(
            { closedCount: result.closed, invoiceIds: result.invoices.map((inv) => inv._id) },
            "Daily invoice closure check completed",
          );
        } catch (error) {
          logger.error({ error }, "Error running daily invoice closure check");
        }
      },
      { timezone: APP_TIMEZONE },
    );

    logger.info("Invoice closure job started - will run daily at 00:05 (BRT)");
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info("Invoice closure job stopped");
    }
  }

  async runNow(): Promise<void> {
    logger.info("Manually triggering invoice closure check");
    const result = await this.closeExpiredInvoicesUseCase.execute();
    logger.info(
      { closedCount: result.closed, invoiceIds: result.invoices.map((inv) => inv._id) },
      "Manual invoice closure check completed",
    );
  }
}

export const invoiceClosureJob = new InvoiceClosureJob();
