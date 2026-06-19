import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, BadRequestException } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { ParseExpenseDto } from "../dto/parse-expense.dto";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { ApiTags } from "@nestjs/swagger";
import { validateDto } from "../utils/validation";
import { validateUpload, RECEIPT_UPLOAD_RULES } from "../utils/validate-upload";
import { readMultipart } from "../utils/read-multipart";
import { ParseExpenseUseCase } from "../use-cases/ai/parse-expense.use-case";
import { ParseExpenseImageUseCase } from "../use-cases/ai/parse-expense-image.use-case";
import { ParseIrReceiptUseCase } from "../use-cases/ai/parse-ir-receipt.use-case";

@ApiTags("ai")
@UseGuards(SessionAuthGuard)
@Controller("ai")
export class AiController {
  constructor(
    private readonly parseExpenseUseCase: ParseExpenseUseCase,
    private readonly parseExpenseImageUseCase: ParseExpenseImageUseCase,
    private readonly parseIrReceiptUseCase: ParseIrReceiptUseCase,
  ) {}

  @Post("parse-expense")
  @HttpCode(HttpStatus.OK)
  async parseExpense(@Body() body: ParseExpenseDto) {
    await validateDto(ParseExpenseDto, body);
    return this.parseExpenseUseCase.execute({ text: body.text });
  }

  @Post("parse-expense-image")
  @HttpCode(HttpStatus.OK)
  async parseExpenseFromImage(@Req() req: FastifyRequest) {
    const { file } = await readMultipart(req);
    if (!file) throw new BadRequestException("Arquivo não enviado");
    const detectedMime = validateUpload(file.buffer, RECEIPT_UPLOAD_RULES);
    return this.parseExpenseImageUseCase.execute({ buffer: file.buffer, mimeType: detectedMime });
  }

  @Post("parse-ir-receipt")
  @HttpCode(HttpStatus.OK)
  async parseIrReceipt(@Req() req: FastifyRequest) {
    const { file } = await readMultipart(req);
    if (!file) throw new BadRequestException("Arquivo não enviado");
    const detectedMime = validateUpload(file.buffer, RECEIPT_UPLOAD_RULES);
    return this.parseIrReceiptUseCase.execute({ buffer: file.buffer, mimeType: detectedMime });
  }
}
