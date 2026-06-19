import { Module } from "@nestjs/common";
import { InvoicesController } from "./invoices.controller";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { ExpenseRepository } from "../repositories/expense.repository";
import { AuthModule } from "./auth.module";
import { ListInvoicesUseCase } from "../use-cases/invoices/list-invoices.use-case";
import { GetInvoiceSummaryUseCase } from "../use-cases/invoices/get-invoice-summary.use-case";
import { GetInvoiceByIdUseCase } from "../use-cases/invoices/get-invoice-by-id.use-case";
import { CreateInvoiceUseCase } from "../use-cases/invoices/create-invoice.use-case";
import { UpdateInvoiceUseCase } from "../use-cases/invoices/update-invoice.use-case";
import { DeleteInvoiceUseCase } from "../use-cases/invoices/delete-invoice.use-case";
import { CreateInvoiceFromCsvUseCase } from "../use-cases/invoices/create-invoice-from-csv.use-case";
import { ImportExpensesFromCsvUseCase } from "../use-cases/invoices/import-expenses-from-csv.use-case";
import { AdvanceInvoicePaymentUseCase } from "../use-cases/invoices/advance-invoice-payment.use-case";
import { CloseInvoiceUseCase } from "../use-cases/invoices/close-invoice.use-case";
import { ReopenInvoiceUseCase } from "../use-cases/invoices/reopen-invoice.use-case";
import { CloseExpiredInvoicesUseCase } from "../use-cases/invoices/close-expired-invoices.use-case";

@Module({
  imports: [AuthModule],
  controllers: [InvoicesController],
  providers: [
    InvoiceRepository,
    ExpenseRepository,
    ListInvoicesUseCase,
    GetInvoiceSummaryUseCase,
    GetInvoiceByIdUseCase,
    CreateInvoiceUseCase,
    UpdateInvoiceUseCase,
    DeleteInvoiceUseCase,
    CreateInvoiceFromCsvUseCase,
    ImportExpensesFromCsvUseCase,
    AdvanceInvoicePaymentUseCase,
    CloseInvoiceUseCase,
    ReopenInvoiceUseCase,
    CloseExpiredInvoicesUseCase,
  ],
  exports: [InvoiceRepository, ExpenseRepository],
})
export class InvoicesModule {}
