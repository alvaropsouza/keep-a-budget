import { Module } from "@nestjs/common";
import { FixedExpenseService } from "../services/fixed-expense.service";
import { FixedExpensesController } from "./fixed-expenses.controller";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [FixedExpensesController],
  providers: [FixedExpenseService],
})
export class FixedExpensesModule {}
