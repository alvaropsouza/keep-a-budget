import { Module } from "@nestjs/common";
import { ExpenseService } from "../services/expense.service";
import { ExpensesController } from "./expenses.controller";
import { AuthModule } from "./auth.module";
import { InvoicesModule } from "./invoices.module";
import { IrDocumentModule } from "./ir-document.module";

@Module({
  imports: [AuthModule, InvoicesModule, IrDocumentModule],
  controllers: [ExpensesController],
  providers: [ExpenseService],
})
export class ExpensesModule {}
