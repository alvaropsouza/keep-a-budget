import { Module } from "@nestjs/common";
import { BudgetService } from "../services/budget.service";
import { BudgetController } from "./budget.controller";
import { AuthModule } from "./auth.module";
import { ExpensesModule } from "./expenses.module";

@Module({
  imports: [AuthModule, ExpensesModule],
  controllers: [BudgetController],
  providers: [BudgetService],
})
export class BudgetModule {}
