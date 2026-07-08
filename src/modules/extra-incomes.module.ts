import { Module } from "@nestjs/common";
import { ExtraIncomesController } from "./extra-incomes.controller";
import { ExtraIncomeRepository } from "../repositories/extra-income.repository";
import { ListExtraIncomesUseCase } from "../use-cases/extra-incomes/list-extra-incomes.use-case";
import { CreateExtraIncomeUseCase } from "../use-cases/extra-incomes/create-extra-income.use-case";
import { DeleteExtraIncomeUseCase } from "../use-cases/extra-incomes/delete-extra-income.use-case";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [ExtraIncomesController],
  providers: [
    ExtraIncomeRepository,
    ListExtraIncomesUseCase,
    CreateExtraIncomeUseCase,
    DeleteExtraIncomeUseCase,
  ],
  exports: [ExtraIncomeRepository],
})
export class ExtraIncomesModule {}
