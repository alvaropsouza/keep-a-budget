import { Module } from "@nestjs/common";
import { ExpensesController } from "./expenses.controller";
import { AuthModule } from "./auth.module";
import { InvoicesModule } from "./invoices.module";
import { IrDocumentModule } from "./ir-documents.module";
import { ExpenseRepository } from "../repositories/expense.repository";
import { S3Service } from "../services/s3.service";
import { InvoiceService } from "../services/invoice.service";
import { ListExpensesUseCase } from "../use-cases/expenses/list-expenses.use-case";
import { GetExpenseByIdUseCase } from "../use-cases/expenses/get-expense-by-id.use-case";
import { CreateExpenseUseCase } from "../use-cases/expenses/create-expense.use-case";
import { UpdateExpenseUseCase } from "../use-cases/expenses/update-expense.use-case";
import { DeleteExpenseUseCase } from "../use-cases/expenses/delete-expense.use-case";
import { UploadExpenseReceiptUseCase } from "../use-cases/expenses/upload-expense-receipt.use-case";
import { DeleteExpenseReceiptUseCase } from "../use-cases/expenses/delete-expense-receipt.use-case";
import { ListIrExpensesUseCase } from "../use-cases/expenses/list-ir-expenses.use-case";
import { GetIrSummaryUseCase } from "../use-cases/expenses/get-ir-summary.use-case";
import { ExportIrZipUseCase } from "../use-cases/expenses/export-ir-zip.use-case";

@Module({
  imports: [AuthModule, InvoicesModule, IrDocumentModule],
  controllers: [ExpensesController],
  providers: [
    ExpenseRepository,
    S3Service,
    InvoiceService,
    ListExpensesUseCase,
    GetExpenseByIdUseCase,
    CreateExpenseUseCase,
    UpdateExpenseUseCase,
    DeleteExpenseUseCase,
    UploadExpenseReceiptUseCase,
    DeleteExpenseReceiptUseCase,
    ListIrExpensesUseCase,
    GetIrSummaryUseCase,
    ExportIrZipUseCase,
  ],
  exports: [ExpenseRepository],
})
export class ExpensesModule {}
