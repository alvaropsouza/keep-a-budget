import { Injectable, Logger } from "@nestjs/common";
import { AiService, type ParsedIrReceiptResponse } from "../../services/ai.service";

export type ParseIrReceiptInput = { buffer: Buffer; mimeType: string };

@Injectable()
export class ParseIrReceiptUseCase {
  private readonly logger = new Logger(ParseIrReceiptUseCase.name);

  constructor(private readonly aiService: AiService) {}

  async execute(input: ParseIrReceiptInput): Promise<ParsedIrReceiptResponse> {
    this.logger.log("ParseIrReceiptUseCase.execute");
    const result = await this.aiService.parseIrReceiptFromFile(input.buffer, input.mimeType);
    this.logger.log("ParseIrReceiptUseCase.execute done");
    return result;
  }
}
