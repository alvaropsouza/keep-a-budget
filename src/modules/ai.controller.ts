import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, BadRequestException } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { ParseExpenseDto } from "../dto/parse-expense.dto";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { ApiTags } from "@nestjs/swagger";
import { validateDto } from "../utils/validation";
import { validateUpload, RECEIPT_UPLOAD_RULES } from "../utils/validate-upload";
import { readMultipart, readMultipartFiles } from "../utils/read-multipart";
import { ParseExpenseUseCase } from "../use-cases/ai/parse-expense.use-case";
import { ParseExpenseImagesUseCase } from "../use-cases/ai/parse-expense-images.use-case";
import { ParseIrReceiptUseCase } from "../use-cases/ai/parse-ir-receipt.use-case";
import { ParseStockTicketUseCase } from "../use-cases/ai/parse-stock-ticket.use-case";

const MAX_EXPENSE_IMAGES = 10;

@ApiTags("ai")
@UseGuards(SessionAuthGuard)
@Controller("ai")
export class AiController {
  constructor(
    private readonly parseExpenseUseCase: ParseExpenseUseCase,
    private readonly parseExpenseImagesUseCase: ParseExpenseImagesUseCase,
    private readonly parseIrReceiptUseCase: ParseIrReceiptUseCase,
    private readonly parseStockTicketUseCase: ParseStockTicketUseCase,
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
    const { files } = await readMultipartFiles(req);
    if (files.length === 0) throw new BadRequestException("Arquivo não enviado");
    if (files.length > MAX_EXPENSE_IMAGES)
      throw new BadRequestException(`Máximo ${MAX_EXPENSE_IMAGES} comprovantes por vez`);
    const items = files.map((file) => ({
      buffer: file.buffer,
      mimeType: validateUpload(file.buffer, RECEIPT_UPLOAD_RULES),
    }));
    return this.parseExpenseImagesUseCase.execute({ items });
  }

  @Post("parse-ir-receipt")
  @HttpCode(HttpStatus.OK)
  async parseIrReceipt(@Req() req: FastifyRequest) {
    const { file } = await readMultipart(req);
    if (!file) throw new BadRequestException("Arquivo não enviado");
    const detectedMime = validateUpload(file.buffer, RECEIPT_UPLOAD_RULES);
    return this.parseIrReceiptUseCase.execute({ buffer: file.buffer, mimeType: detectedMime });
  }

  @Post("parse-stock-ticket")
  @HttpCode(HttpStatus.OK)
  async parseStockTicket(@Req() req: FastifyRequest) {
    const { file } = await readMultipart(req);
    if (!file) throw new BadRequestException("Arquivo não enviado");
    const detectedMime = validateUpload(file.buffer, RECEIPT_UPLOAD_RULES);
    return this.parseStockTicketUseCase.execute({ buffer: file.buffer, mimeType: detectedMime });
  }
}
