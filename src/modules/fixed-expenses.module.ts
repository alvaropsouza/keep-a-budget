import { Module } from "@nestjs/common";
import { FixedExpenseService } from "../services/fixedExpense.service";
import { FixedExpensesController } from "./fixed-expenses.controller";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [FixedExpensesController],
  providers: [FixedExpenseService],
})
export class FixedExpensesModule {}
