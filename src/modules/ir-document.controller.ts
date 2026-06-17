import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { IrDocumentService } from "../services/ir-document.service";
import { IrDocumentQueryDto, CreateIrDocumentDto } from "../dto/ir-document.dto";
import { SessionAuthGuard } from "./session-auth.guard";
import { AppError } from "../utils/AppError";
import { validateDto } from "../utils/validation";
import { validateUpload } from "../utils/validateUpload";

@UseGuards(SessionAuthGuard)
@Controller("ir-documents")
export class IrDocumentController {
  constructor(
    @Inject(IrDocumentService) private readonly irDocumentService: IrDocumentService,
  ) {}

  @Get()
  async list(@Query() query: IrDocumentQueryDto, @Req() req: FastifyRequest) {
    const year = Number(query.year);
    return this.irDocumentService.getSignedDocuments(year, req.authUser!.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: FastifyRequest) {
    const formFields: Record<string, string> = {};
    let fileBuffer: Buffer | undefined;
    let filename: string | undefined;
    let mimetype: string | undefined;

    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === "field") {
        formFields[part.fieldname] = part.value as string;
      } else if (part.type === "file") {
        fileBuffer = await part.toBuffer();
        filename = part.filename;
        mimetype = part.mimetype;
      }
    }

    if (!fileBuffer || !filename || !mimetype) {
      throw new AppError("Comprovante obrigatório", 400);
    }

    const detectedMime = validateUpload(fileBuffer, {
      allowed: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
      maxBytes: 10 * 1024 * 1024,
    });

    const body: CreateIrDocumentDto = {
      date: formFields.date,
      category: formFields.category,
      amount: Number.parseFloat(formFields.amount),
      description: formFields.description,
    };

    const { valid, errors } = await validateDto(CreateIrDocumentDto, body);
    if (!valid) throw new AppError("Dados inválidos", 400, errors);

    return this.irDocumentService.create(
      {
        ...body,
        userId: req.authUser!.userId,
        userEmail: req.authUser?.email,
      },
      { buffer: fileBuffer, filename, mimetype: detectedMime },
    );
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: FastifyRequest) {
    await this.irDocumentService.delete(id, req.authUser!.userId);
    return { message: "Documento removido" };
  }
}
