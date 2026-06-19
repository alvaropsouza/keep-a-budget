import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { IrDocumentQueryDto, CreateIrDocumentDto } from "../dto/ir-document.dto";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { AppError } from "../utils/app-error";
import { ApiTags } from "@nestjs/swagger";
import { validateDto } from "../utils/validation";
import { validateUpload, RECEIPT_UPLOAD_RULES } from "../utils/validate-upload";
import { readMultipart } from "../utils/read-multipart";
import { ListIrDocumentsUseCase } from "../use-cases/ir-documents/list-ir-documents.use-case";
import { CreateIrDocumentUseCase } from "../use-cases/ir-documents/create-ir-document.use-case";
import { DeleteIrDocumentUseCase } from "../use-cases/ir-documents/delete-ir-document.use-case";

@ApiTags("ir-documents")
@UseGuards(SessionAuthGuard)
@Controller("ir-documents")
export class IrDocumentController {
  constructor(
    private readonly listIrDocumentsUseCase: ListIrDocumentsUseCase,
    private readonly createIrDocumentUseCase: CreateIrDocumentUseCase,
    private readonly deleteIrDocumentUseCase: DeleteIrDocumentUseCase,
  ) {}

  @Get()
  async list(@Query() query: IrDocumentQueryDto, @Req() req: FastifyRequest) {
    return this.listIrDocumentsUseCase.execute({
      userId: req.authUser!.userId,
      year: Number(query.year),
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: FastifyRequest) {
    const { fields, file } = await readMultipart(req);
    if (!file) throw new AppError("Comprovante obrigatório", 400);

    const detectedMime = validateUpload(file.buffer, RECEIPT_UPLOAD_RULES);

    const body: CreateIrDocumentDto = {
      date: fields.date,
      category: fields.category,
      amount: Number.parseFloat(fields.amount),
      description: fields.description,
    };

    const { valid, errors } = await validateDto(CreateIrDocumentDto, body);
    if (!valid) throw new AppError("Dados inválidos", 400, errors);

    return this.createIrDocumentUseCase.execute({
      ...body,
      userId: req.authUser!.userId,
      userEmail: req.authUser?.email,
      file: { buffer: file.buffer, filename: file.filename, mimetype: detectedMime },
    });
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: FastifyRequest) {
    await this.deleteIrDocumentUseCase.execute({ id, userId: req.authUser!.userId });
    return { message: "Documento removido" };
  }
}
