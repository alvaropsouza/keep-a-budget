import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, BadRequestException } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { AiService } from "../services/ai.service";
import { ParseExpenseDto } from "../dto/parse-expense.dto";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { ApiTags } from "@nestjs/swagger";
import { validateDto } from "../utils/validation";
import { validateUpload, RECEIPT_UPLOAD_RULES } from "../utils/validateUpload";
import { readMultipart } from "../utils/readMultipart";

@ApiTags("ai")
@UseGuards(SessionAuthGuard)
@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("parse-expense")
  @HttpCode(HttpStatus.OK)
  async parseExpense(@Body() body: ParseExpenseDto) {
    await validateDto(ParseExpenseDto, body);
    return this.aiService.parseExpense(body.text);
  }

  @Post("parse-expense-image")
  @HttpCode(HttpStatus.OK)
  async parseExpenseFromImage(@Req() req: FastifyRequest) {
    const { file } = await readMultipart(req);
    if (!file) throw new BadRequestException("Arquivo não enviado");

    const detectedMime = validateUpload(file.buffer, RECEIPT_UPLOAD_RULES);

    return this.aiService.parseExpenseFromImage(file.buffer, detectedMime);
  }

  @Post("parse-ir-receipt")
  @HttpCode(HttpStatus.OK)
  async parseIrReceipt(@Req() req: FastifyRequest) {
    const { file } = await readMultipart(req);
    if (!file) throw new BadRequestException("Arquivo não enviado");

    const detectedMime = validateUpload(file.buffer, RECEIPT_UPLOAD_RULES);

    return this.aiService.parseIrReceiptFromFile(file.buffer, detectedMime);
  }
}
