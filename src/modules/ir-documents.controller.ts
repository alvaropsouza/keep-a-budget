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
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { AppError } from "../utils/app-error";
import { ApiTags } from "@nestjs/swagger";
import { validateDto } from "../utils/validation";
import { validateUpload, RECEIPT_UPLOAD_RULES } from "../utils/validate-upload";
import { readMultipart } from "../utils/read-multipart";

@ApiTags("ir-documents")
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
    const { fields, file } = await readMultipart(req);

    if (!file) {
      throw new AppError("Comprovante obrigatório", 400);
    }

    const detectedMime = validateUpload(file.buffer, RECEIPT_UPLOAD_RULES);

    const body: CreateIrDocumentDto = {
      date: fields.date,
      category: fields.category,
      amount: Number.parseFloat(fields.amount),
      description: fields.description,
    };

    const { valid, errors } = await validateDto(CreateIrDocumentDto, body);
    if (!valid) throw new AppError("Dados inválidos", 400, errors);

    return this.irDocumentService.create(
      {
        ...body,
        userId: req.authUser!.userId,
        userEmail: req.authUser?.email,
      },
      { buffer: file.buffer, filename: file.filename, mimetype: detectedMime },
    );
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: FastifyRequest) {
    await this.irDocumentService.delete(id, req.authUser!.userId);
    return { message: "Documento removido" };
  }
}
