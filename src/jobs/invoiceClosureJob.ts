import cron from "node-cron";
import logger from "../config/logger";
import { InvoiceService } from "../services/invoice.service";

export class InvoiceClosureJob {
  private invoiceService: InvoiceService;
  private task: ReturnType<typeof cron.schedule> | null = null;

  constructor() {
    this.invoiceService = new InvoiceService();
  }

  /**
   * Starts the daily job to close expired invoices
   * Runs every day at 00:05 (5 minutes past midnight)
   */
  start(): void {
    if (this.task) {
      logger.warn("Invoice closure job is already running");
      return;
    }

    // Cron pattern: "minute hour day month weekday"
    // "5 0 * * *" = At 00:05 every day
    this.task = cron.schedule("5 0 * * *", async () => {
      try {
        logger.info("Running daily invoice closure check");
        const result = await this.invoiceService.checkAndCloseExpiredInvoices();
        logger.info(
          {
            closedCount: result.closed,
            invoiceIds: result.invoices.map((inv) => inv._id),
          },
          "Daily invoice closure check completed",
        );
      } catch (error) {
        logger.error({ error }, "Error running daily invoice closure check");
      }
    });

    logger.info("Invoice closure job started - will run daily at 00:05");
  }

  /**
   * Stops the daily job
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info("Invoice closure job stopped");
    }
  }

  /**
   * Manually trigger the invoice closure check
   * Useful for testing or manual execution
   */
  async runNow(): Promise<void> {
    logger.info("Manually triggering invoice closure check");
    const result = await this.invoiceService.checkAndCloseExpiredInvoices();
    logger.info(
      {
        closedCount: result.closed,
        invoiceIds: result.invoices.map((inv) => inv._id),
      },
      "Manual invoice closure check completed",
    );
  }
}

// Export singleton instance
export const invoiceClosureJob = new InvoiceClosureJob();
