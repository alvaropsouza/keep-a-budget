import { Module } from "@nestjs/common";
import { ExpenseService } from "../services/expense.service";
import { ExpensesController } from "./expenses.controller";
import { AuthModule } from "./auth.module";
import { InvoicesModule } from "./invoices.module";

@Module({
  imports: [AuthModule, InvoicesModule],
  controllers: [ExpensesController],
  providers: [ExpenseService],
})
export class ExpensesModule {}
