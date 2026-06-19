import { Injectable, Logger } from "@nestjs/common";
import { AiService } from "../../services/ai.service";
import type { ParsedExpenseResponse } from "../../dto/parse-expense.dto";

export type ParseExpenseImageInput = { buffer: Buffer; mimeType: string };

@Injectable()
export class ParseExpenseImageUseCase {
  private readonly logger = new Logger(ParseExpenseImageUseCase.name);

  constructor(private readonly aiService: AiService) {}

  async execute(input: ParseExpenseImageInput): Promise<ParsedExpenseResponse> {
    this.logger.log("ParseExpenseImageUseCase.execute");
    const result = await this.aiService.parseExpenseFromImage(input.buffer, input.mimeType);
    this.logger.log("ParseExpenseImageUseCase.execute done");
    return result;
  }
}
