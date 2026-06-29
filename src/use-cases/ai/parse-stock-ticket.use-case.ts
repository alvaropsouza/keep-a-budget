import { Injectable, Logger } from "@nestjs/common";
import { AiService, type ParsedStockTicketResponse } from "../../services/ai.service";
import { AppError } from "../../utils/app-error";

export type ParseStockTicketInput = { buffer: Buffer; mimeType: string };

@Injectable()
export class ParseStockTicketUseCase {
  private readonly logger = new Logger(ParseStockTicketUseCase.name);

  constructor(private readonly aiService: AiService) {}

  async execute(input: ParseStockTicketInput): Promise<ParsedStockTicketResponse> {
    this.logger.log("ParseStockTicketUseCase.execute");
    try {
      const result = await this.aiService.parseStockTicket(input.buffer, input.mimeType);
      this.logger.log("ParseStockTicketUseCase.execute done");
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("password protected")) {
        throw new AppError("PDF_PASSWORD_REQUIRED", 422);
      }
      throw err;
    }
  }
}
