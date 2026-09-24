import { Injectable, Logger } from "@nestjs/common";
import { AiService, type ParsedIrReceiptResponse } from "../../services/ai.service";
import { PaymentMethodRepository } from "../../repositories/payment-method.repository";
import { CategoryRepository } from "../../repositories/category.repository";
import { loadUserVocabulary } from "./load-user-vocabulary";

export type ParseIrReceiptInput = { buffer: Buffer; mimeType: string; userId: string };

@Injectable()
export class ParseIrReceiptUseCase {
  private readonly logger = new Logger(ParseIrReceiptUseCase.name);

  constructor(
    private readonly aiService: AiService,
    private readonly paymentMethodRepository: PaymentMethodRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(input: ParseIrReceiptInput): Promise<ParsedIrReceiptResponse> {
    this.logger.log("ParseIrReceiptUseCase.execute");
    const vocabulary = await loadUserVocabulary(
      this.paymentMethodRepository,
      this.categoryRepository,
      input.userId,
    );
    const result = await this.aiService.parseIrReceiptFromFile(input.buffer, input.mimeType, vocabulary);
    this.logger.log("ParseIrReceiptUseCase.execute done");
    return result;
  }
}
