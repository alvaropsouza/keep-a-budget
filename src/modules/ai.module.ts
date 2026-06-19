import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "../services/ai.service";
import { AuthModule } from "./auth.module";
import { ParseExpenseUseCase } from "../use-cases/ai/parse-expense.use-case";
import { ParseExpenseImageUseCase } from "../use-cases/ai/parse-expense-image.use-case";
import { ParseIrReceiptUseCase } from "../use-cases/ai/parse-ir-receipt.use-case";

@Module({
  imports: [AuthModule],
  controllers: [AiController],
  providers: [AiService, ParseExpenseUseCase, ParseExpenseImageUseCase, ParseIrReceiptUseCase],
})
export class AiModule {}
