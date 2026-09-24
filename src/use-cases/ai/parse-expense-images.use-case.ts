import { Injectable, Logger } from "@nestjs/common";
import { AiService } from "../../services/ai.service";
import { PaymentMethodRepository } from "../../repositories/payment-method.repository";
import { CategoryRepository } from "../../repositories/category.repository";
import { loadUserVocabulary } from "./load-user-vocabulary";
import type { ParsedExpenseResponse } from "../../dto/parse-expense.dto";

export type ParseExpenseImagesInput = { items: { buffer: Buffer; mimeType: string }[]; userId: string };

@Injectable()
export class ParseExpenseImagesUseCase {
  private readonly logger = new Logger(ParseExpenseImagesUseCase.name);

  constructor(
    private readonly aiService: AiService,
    private readonly paymentMethodRepository: PaymentMethodRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(input: ParseExpenseImagesInput): Promise<ParsedExpenseResponse[]> {
    this.logger.log({ count: input.items.length }, "ParseExpenseImagesUseCase.execute");
    const vocabulary = await loadUserVocabulary(
      this.paymentMethodRepository,
      this.categoryRepository,
      input.userId,
    );
    const results = await Promise.all(
      input.items.map((item) =>
        this.aiService.parseExpenseFromImage(item.buffer, item.mimeType, vocabulary),
      ),
    );
    this.logger.log("ParseExpenseImagesUseCase.execute done");
    return results.flat();
  }
}
