import { Module } from "@nestjs/common";
import { BudgetController } from "./budgets.controller";
import { BudgetRepository } from "../repositories/budget.repository";
import { S3Service } from "../services/s3.service";
import { ListBudgetsUseCase } from "../use-cases/budgets/list-budgets.use-case";
import { GetBudgetSummaryUseCase } from "../use-cases/budgets/get-budget-summary.use-case";
import { GetActiveBudgetSummaryUseCase } from "../use-cases/budgets/get-active-budget-summary.use-case";
import { GetBudgetExpensesUseCase } from "../use-cases/budgets/get-budget-expenses.use-case";
import { UpsertBudgetUseCase } from "../use-cases/budgets/upsert-budget.use-case";
import { DeleteBudgetUseCase } from "../use-cases/budgets/delete-budget.use-case";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [BudgetController],
  providers: [
    BudgetRepository,
    S3Service,
    ListBudgetsUseCase,
    GetBudgetSummaryUseCase,
    GetActiveBudgetSummaryUseCase,
    GetBudgetExpensesUseCase,
    UpsertBudgetUseCase,
    DeleteBudgetUseCase,
  ],
  exports: [BudgetRepository],
})
export class BudgetModule {}
