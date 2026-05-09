import { Module } from "@nestjs/common";
import { FixedExpenseService } from "../services/fixedExpense.service";
import { FixedExpensesHttpController } from "./fixed-expenses-http.controller";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [FixedExpensesHttpController],
  providers: [FixedExpenseService],
})
export class FixedExpensesModule {}
