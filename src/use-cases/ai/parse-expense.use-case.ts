import { Injectable, Logger } from "@nestjs/common";
import { AiService } from "../../services/ai.service";
import { PaymentMethodRepository } from "../../repositories/payment-method.repository";
import { CategoryRepository } from "../../repositories/category.repository";
import { loadUserVocabulary } from "./load-user-vocabulary";
import type { ParsedExpenseResponse } from "../../dto/parse-expense.dto";

export type ParseExpenseInput = { text: string; userId: string };

@Injectable()
export class ParseExpenseUseCase {
  private readonly logger = new Logger(ParseExpenseUseCase.name);

  constructor(
    private readonly aiService: AiService,
    private readonly paymentMethodRepository: PaymentMethodRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(input: ParseExpenseInput): Promise<ParsedExpenseResponse> {
    this.logger.log("ParseExpenseUseCase.execute");
    const vocabulary = await loadUserVocabulary(
      this.paymentMethodRepository,
      this.categoryRepository,
      input.userId,
    );
    const result = await this.aiService.parseExpense(input.text, vocabulary);
    this.logger.log("ParseExpenseUseCase.execute done");
    return result;
  }
}
