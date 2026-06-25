import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "../services/ai.service";
import { AuthModule } from "./auth.module";
import { ParseExpenseUseCase } from "../use-cases/ai/parse-expense.use-case";
import { ParseExpenseImagesUseCase } from "../use-cases/ai/parse-expense-images.use-case";
import { ParseIrReceiptUseCase } from "../use-cases/ai/parse-ir-receipt.use-case";
import { ParseStockTicketUseCase } from "../use-cases/ai/parse-stock-ticket.use-case";

@Module({
  imports: [AuthModule],
  controllers: [AiController],
  providers: [AiService, ParseExpenseUseCase, ParseExpenseImagesUseCase, ParseIrReceiptUseCase, ParseStockTicketUseCase],
})
export class AiModule {}
