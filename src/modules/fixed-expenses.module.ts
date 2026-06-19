import { Module } from "@nestjs/common";
import { FixedExpensesController } from "./fixed-expenses.controller";
import { FixedExpenseRepository } from "../repositories/fixed-expense.repository";
import { ListFixedExpensesUseCase } from "../use-cases/fixed-expenses/list-fixed-expenses.use-case";
import { GetFixedExpenseByIdUseCase } from "../use-cases/fixed-expenses/get-fixed-expense-by-id.use-case";
import { CreateFixedExpenseUseCase } from "../use-cases/fixed-expenses/create-fixed-expense.use-case";
import { UpdateFixedExpenseUseCase } from "../use-cases/fixed-expenses/update-fixed-expense.use-case";
import { DeleteFixedExpenseUseCase } from "../use-cases/fixed-expenses/delete-fixed-expense.use-case";
import { GetTotalFixedExpensesUseCase } from "../use-cases/fixed-expenses/get-total-fixed-expenses.use-case";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [FixedExpensesController],
  providers: [
    FixedExpenseRepository,
    ListFixedExpensesUseCase,
    GetFixedExpenseByIdUseCase,
    CreateFixedExpenseUseCase,
    UpdateFixedExpenseUseCase,
    DeleteFixedExpenseUseCase,
    GetTotalFixedExpensesUseCase,
  ],
  exports: [FixedExpenseRepository, GetTotalFixedExpensesUseCase],
})
export class FixedExpensesModule {}
