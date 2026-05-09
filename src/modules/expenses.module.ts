import { Module } from "@nestjs/common";
import { ExpenseService } from "../services/expense.service";
import { ExpensesHttpController } from "./expenses-http.controller";
import { AuthModule } from "./auth.module";
import { InvoicesModule } from "./invoices.module";

@Module({
  imports: [AuthModule, InvoicesModule],
  controllers: [ExpensesHttpController],
  providers: [ExpenseService],
})
export class ExpensesModule {}
