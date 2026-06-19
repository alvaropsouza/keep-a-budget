import {
  Controller,
  Delete,
  Get,
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
import { readMultipart, type MultipartFile } from "../utils/read-multipart";
import { ListInvoicesUseCase } from "../use-cases/invoices/list-invoices.use-case";
import { GetInvoiceSummaryUseCase } from "../use-cases/invoices/get-invoice-summary.use-case";
import { GetInvoiceByIdUseCase } from "../use-cases/invoices/get-invoice-by-id.use-case";
import { CreateInvoiceUseCase } from "../use-cases/invoices/create-invoice.use-case";
import { UpdateInvoiceUseCase } from "../use-cases/invoices/update-invoice.use-case";
import { DeleteInvoiceUseCase } from "../use-cases/invoices/delete-invoice.use-case";
import { CreateInvoiceFromCsvUseCase } from "../use-cases/invoices/create-invoice-from-csv.use-case";
import { ImportExpensesFromCsvUseCase } from "../use-cases/invoices/import-expenses-from-csv.use-case";
import { AdvanceInvoicePaymentUseCase } from "../use-cases/invoices/advance-invoice-payment.use-case";
import { CloseInvoiceUseCase } from "../use-cases/invoices/close-invoice.use-case";
import { ReopenInvoiceUseCase } from "../use-cases/invoices/reopen-invoice.use-case";

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
  constructor(
    private readonly listInvoicesUseCase: ListInvoicesUseCase,
    private readonly getInvoiceSummaryUseCase: GetInvoiceSummaryUseCase,
    private readonly getInvoiceByIdUseCase: GetInvoiceByIdUseCase,
    private readonly createInvoiceUseCase: CreateInvoiceUseCase,
    private readonly updateInvoiceUseCase: UpdateInvoiceUseCase,
    private readonly deleteInvoiceUseCase: DeleteInvoiceUseCase,
    private readonly createInvoiceFromCsvUseCase: CreateInvoiceFromCsvUseCase,
    private readonly importExpensesFromCsvUseCase: ImportExpensesFromCsvUseCase,
    private readonly advanceInvoicePaymentUseCase: AdvanceInvoicePaymentUseCase,
    private readonly closeInvoiceUseCase: CloseInvoiceUseCase,
    private readonly reopenInvoiceUseCase: ReopenInvoiceUseCase,
  ) {}

  @Get()
  async getAll(@Query() query: InvoiceQueryParamsDto, @Req() req: FastifyRequest) {
    return this.listInvoicesUseCase.execute({ ...query, userId: req.authUser!.userId });
  }

  @Get("summary")
  async getSummary(@Req() req: FastifyRequest) {
    return this.getInvoiceSummaryUseCase.execute({ userId: req.authUser!.userId });
  }

  @Get(":id")
  async getById(@Param("id") id: string, @Req() req: FastifyRequest) {
    return this.getInvoiceByIdUseCase.execute({ id, userId: req.authUser!.userId });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateInvoiceDto, @Req() req: FastifyRequest) {
    return this.createInvoiceUseCase.execute({ ...body, userId: req.authUser!.userId });
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

    return this.createInvoiceFromCsvUseCase.execute({
      bank,
      closingDate,
      dueDate,
      csvContent,
      excludeIndexes,
      userId: req.authUser!.userId,
    });
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: UpdateInvoiceDto, @Req() req: FastifyRequest) {
    return this.updateInvoiceUseCase.execute({ id, ...body, userId: req.authUser!.userId });
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: FastifyRequest) {
    await this.deleteInvoiceUseCase.execute({ id, userId: req.authUser!.userId });
    return { message: "Invoice and associated expenses deleted successfully" };
  }

  @Post(":id/advance")
  async advance(@Param("id") id: string, @Body() body: AdvanceInvoiceDto, @Req() req: FastifyRequest) {
    return this.advanceInvoicePaymentUseCase.execute({ id, amount: body.amount, userId: req.authUser!.userId });
  }

  @Post(":id/close")
  async close(@Param("id") id: string, @Body() body: CloseInvoiceDto, @Req() req: FastifyRequest) {
    return this.closeInvoiceUseCase.execute({ id, manualBalance: body.balance, userId: req.authUser!.userId });
  }

  @Post(":id/reopen")
  async reopen(@Param("id") id: string, @Req() req: FastifyRequest) {
    return this.reopenInvoiceUseCase.execute({ id, userId: req.authUser!.userId });
  }

  @Post(":id/import-csv")
  async importCsv(@Param("id") id: string, @Req() req: FastifyRequest) {
    const { fields, file } = await readMultipart(req);

    const csvContent = readCsvContent(file);
    const excludeIndexes = parseExcludeIndexes(fields.excludeIndexes);

    if (!csvContent) throw new AppError("No file uploaded", 400);

    return this.importExpensesFromCsvUseCase.execute({ id, csvContent, excludeIndexes, userId: req.authUser!.userId });
  }
}
