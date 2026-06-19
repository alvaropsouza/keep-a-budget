import { Injectable, Logger } from "@nestjs/common";
import { AiService } from "../../services/ai.service";
import type { ParsedExpenseResponse } from "../../dto/parse-expense.dto";

export type ParseExpenseInput = { text: string };

@Injectable()
export class ParseExpenseUseCase {
  private readonly logger = new Logger(ParseExpenseUseCase.name);

  constructor(private readonly aiService: AiService) {}

  async execute(input: ParseExpenseInput): Promise<ParsedExpenseResponse> {
    this.logger.log("ParseExpenseUseCase.execute");
    const result = await this.aiService.parseExpense(input.text);
    this.logger.log("ParseExpenseUseCase.execute done");
    return result;
  }
}
