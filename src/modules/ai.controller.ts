import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, BadRequestException } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { AiService } from "../services/ai.service";
import { ParseExpenseDto } from "../dto/parse-expense.dto";
import { SessionAuthGuard } from "./session-auth.guard";
import { validateDto } from "../utils/validation";
import { validateUpload } from "../utils/validateUpload";

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
    let fileBuffer: Buffer | undefined;
    let mimetype: string | undefined;

    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === "file") {
        fileBuffer = await part.toBuffer();
        mimetype = part.mimetype;
      }
    }

    if (!fileBuffer || !mimetype) throw new BadRequestException("Arquivo não enviado");

    const detectedMime = validateUpload(fileBuffer, {
      allowed: ["image/jpeg", "image/png", "image/webp"],
      maxBytes: 5 * 1024 * 1024,
    });

    return this.aiService.parseExpenseFromImage(fileBuffer, detectedMime);
  }

  @Post("parse-ir-receipt")
  @HttpCode(HttpStatus.OK)
  async parseIrReceipt(@Req() req: FastifyRequest) {
    let fileBuffer: Buffer | undefined;
    let mimetype: string | undefined;

    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === "file") {
        fileBuffer = await part.toBuffer();
        mimetype = part.mimetype;
      }
    }

    if (!fileBuffer || !mimetype) throw new BadRequestException("Arquivo não enviado");

    const detectedMime = validateUpload(fileBuffer, {
      allowed: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
      maxBytes: 10 * 1024 * 1024,
    });

    return this.aiService.parseIrReceiptFromFile(fileBuffer, detectedMime);
  }
}
