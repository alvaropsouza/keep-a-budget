import { Injectable, Logger } from "@nestjs/common";
import { AiService, type ParsedStockTicketResponse } from "../../services/ai.service";

export type ParseStockTicketInput = { buffer: Buffer; mimeType: string };

@Injectable()
export class ParseStockTicketUseCase {
  private readonly logger = new Logger(ParseStockTicketUseCase.name);

  constructor(private readonly aiService: AiService) {}

  async execute(input: ParseStockTicketInput): Promise<ParsedStockTicketResponse> {
    this.logger.log("ParseStockTicketUseCase.execute");
    const result = await this.aiService.parseStockTicket(input.buffer, input.mimeType);
    this.logger.log("ParseStockTicketUseCase.execute done");
    return result;
  }
}
