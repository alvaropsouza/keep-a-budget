import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { InvoiceService } from "../services/invoice.service";
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceQueryParamsDto,
  AdvanceInvoiceDto,
  CloseInvoiceDto,
} from "../dto/invoice.dto";
import { BanksEnum } from "../enums/banks.enum";
import { ApiTags } from "@nestjs/swagger";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { AppError } from "../utils/app-error";
import { readMultipart, type MultipartFile } from "../utils/readMultipart";

const readCsvContent = (file?: MultipartFile): string | null => {
  if (!file) return null;
  if (!file.filename.endsWith(".csv") && !file.mimetype.includes("csv")) {
    throw new AppError("Only CSV files are accepted", 400);
  }
  return file.buffer.toString("utf-8");
};

const parseBank = (value?: string): BanksEnum | null => {
  const raw = String(value ?? "").toUpperCase();
  if (raw === BanksEnum.XP || raw === BanksEnum.NUBANK) return raw as BanksEnum;
  return null;
};

const parseExcludeIndexes = (value?: string): number[] | undefined => {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as number[];
  } catch {
    return undefined;
  }
};

@ApiTags("invoices")
@UseGuards(SessionAuthGuard)
@Controller("invoices")
export class InvoicesController {
  constructor(@Inject(InvoiceService) private readonly invoiceService: InvoiceService) {}

  @Get()
  async getAll(@Query() query: InvoiceQueryParamsDto, @Req() req: FastifyRequest) {
    const filter = this.invoiceService.buildFilter(query);
    return this.invoiceService.getAllWithExpenses(filter, req.authUser!.userId);
  }

  @Get("summary")
  async getSummary(@Req() req: FastifyRequest) {
    return this.invoiceService.getSummary(req.authUser!.userId);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @Req() req: FastifyRequest) {
    return this.invoiceService.getByIdWithExpenses(id, req.authUser!.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateInvoiceDto, @Req() req: FastifyRequest) {
    return this.invoiceService.createInvoice({ ...body, userId: req.authUser!.userId });
  }

  @Post("create-from-csv")
  @HttpCode(HttpStatus.CREATED)
  async createFromCsv(@Req() req: FastifyRequest) {
    const { fields, file } = await readMultipart(req);

    const csvContent = readCsvContent(file);
    const closingDate = fields.closingDate ?? null;
    const dueDate = fields.dueDate ?? null;
    const bank = parseBank(fields.bank);
    const excludeIndexes = parseExcludeIndexes(fields.excludeIndexes);

    if (!csvContent) throw new AppError("No CSV file uploaded", 400);
    if (!closingDate || !dueDate) throw new AppError("closingDate and dueDate are required", 400);
    if (!bank) throw new AppError("bank is required", 400);

    return this.invoiceService.createFromCsv(
      bank,
      closingDate,
      dueDate,
      csvContent,
      excludeIndexes,
      req.authUser!.userId,
    );
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: UpdateInvoiceDto, @Req() req: FastifyRequest) {
    return this.invoiceService.update(id, body, req.authUser!.userId);
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: FastifyRequest) {
    await this.invoiceService.deleteWithExpenses(id, req.authUser!.userId);
    return { message: "Invoice and associated expenses deleted successfully" };
  }

  @Post(":id/advance")
  async advance(@Param("id") id: string, @Body() body: AdvanceInvoiceDto, @Req() req: FastifyRequest) {
    return this.invoiceService.advancePayment(id, body.amount, req.authUser!.userId);
  }

  @Post(":id/close")
  async close(@Param("id") id: string, @Body() body: CloseInvoiceDto, @Req() req: FastifyRequest) {
    return this.invoiceService.closeInvoice(id, body.balance, req.authUser!.userId);
  }

  @Post(":id/reopen")
  async reopen(@Param("id") id: string, @Req() req: FastifyRequest) {
    return this.invoiceService.reopenInvoice(id, req.authUser!.userId);
  }

  @Post(":id/import-csv")
  async importCsv(@Param("id") id: string, @Req() req: FastifyRequest) {
    const { fields, file } = await readMultipart(req);

    const csvContent = readCsvContent(file);
    const excludeIndexes = parseExcludeIndexes(fields.excludeIndexes);

    if (!csvContent) throw new AppError("No file uploaded", 400);

    return this.invoiceService.importFromCsv(id, csvContent, excludeIndexes, req.authUser!.userId);
  }
}
