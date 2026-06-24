import { Injectable, Logger } from "@nestjs/common";
import { AiService } from "../../services/ai.service";
import type { ParsedExpenseResponse } from "../../dto/parse-expense.dto";

export type ParseExpenseImagesInput = { items: { buffer: Buffer; mimeType: string }[] };

@Injectable()
export class ParseExpenseImagesUseCase {
  private readonly logger = new Logger(ParseExpenseImagesUseCase.name);

  constructor(private readonly aiService: AiService) {}

  async execute(input: ParseExpenseImagesInput): Promise<ParsedExpenseResponse[]> {
    this.logger.log({ count: input.items.length }, "ParseExpenseImagesUseCase.execute");
    const results = await Promise.all(
      input.items.map((item) => this.aiService.parseExpenseFromImage(item.buffer, item.mimeType)),
    );
    this.logger.log("ParseExpenseImagesUseCase.execute done");
    return results.flat();
  }
}
