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
import { SessionAuthGuard } from "./session-auth.guard";
import { AppError } from "../utils/AppError";

@UseGuards(SessionAuthGuard)
@Controller("invoices")
export class InvoicesController {
  constructor(@Inject(InvoiceService) private readonly invoiceService: InvoiceService) {}

  @Get()
  async getAll(@Query() query: InvoiceQueryParamsDto, @Req() req: FastifyRequest) {
    const filter = this.invoiceService.buildFilter(query);
    return this.invoiceService.getAllWithExpenses(filter, req.authUser?.userId);
  }

  @Get("summary")
  async getSummary(@Req() req: FastifyRequest) {
    return this.invoiceService.getSummary(req.authUser?.userId);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @Req() req: FastifyRequest) {
    return this.invoiceService.getByIdWithExpenses(id, req.authUser?.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateInvoiceDto, @Req() req: FastifyRequest) {
    return this.invoiceService.createInvoice({ ...body, userId: req.authUser?.userId });
  }

  @Post("create-from-csv")
  @HttpCode(HttpStatus.CREATED)
  async createFromCsv(@Req() req: FastifyRequest) {
    let csvContent: string | null = null;
    let closingDate: string | null = null;
    let dueDate: string | null = null;
    let bank: BanksEnum | null = null;
    let excludeIndexes: number[] | undefined;

    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === "field") {
        if (part.fieldname === "closingDate") closingDate = part.value as string;
        if (part.fieldname === "dueDate") dueDate = part.value as string;
        if (part.fieldname === "bank") {
          const rawBank = String(part.value).toUpperCase();
          if (rawBank === BanksEnum.XP || rawBank === BanksEnum.NUBANK) {
            bank = rawBank as BanksEnum;
          }
        }
        if (part.fieldname === "excludeIndexes") {
          try {
            excludeIndexes = JSON.parse(part.value as string) as number[];
          } catch {
            // ignore malformed value
          }
        }
      } else if (part.type === "file") {
        if (!part.filename.endsWith(".csv") && !part.mimetype.includes("csv")) {
          throw new AppError("Only CSV files are accepted", 400);
        }
        const buffer = await part.toBuffer();
        csvContent = buffer.toString("utf-8");
      }
    }

    if (!csvContent) throw new AppError("No CSV file uploaded", 400);
    if (!closingDate || !dueDate) throw new AppError("closingDate and dueDate are required", 400);
    if (!bank) throw new AppError("bank is required", 400);

    return this.invoiceService.createFromCsv(
      bank,
      closingDate,
      dueDate,
      csvContent,
      excludeIndexes,
      req.authUser?.userId,
    );
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: UpdateInvoiceDto) {
    return this.invoiceService.update(id, body);
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    await this.invoiceService.deleteWithExpenses(id);
    return { message: "Invoice and associated expenses deleted successfully" };
  }

  @Post(":id/advance")
  async advance(@Param("id") id: string, @Body() body: AdvanceInvoiceDto) {
    return this.invoiceService.advancePayment(id, body.amount);
  }

  @Post(":id/close")
  async close(@Param("id") id: string, @Body() body: CloseInvoiceDto) {
    return this.invoiceService.closeInvoice(id, body.balance);
  }

  @Post(":id/reopen")
  async reopen(@Param("id") id: string) {
    return this.invoiceService.reopenInvoice(id);
  }

  @Post(":id/import-csv")
  async importCsv(@Param("id") id: string, @Req() req: FastifyRequest) {
    let csvContent: string | null = null;
    let excludeIndexes: number[] | undefined;

    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === "field") {
        if (part.fieldname === "excludeIndexes") {
          try {
            excludeIndexes = JSON.parse(part.value as string) as number[];
          } catch {
            // ignore malformed value
          }
        }
      } else if (part.type === "file") {
        if (!part.mimetype.includes("csv") && !part.filename.endsWith(".csv")) {
          throw new AppError("Only CSV files are accepted", 400);
        }
        const buffer = await part.toBuffer();
        csvContent = buffer.toString("utf-8");
      }
    }

    if (!csvContent) throw new AppError("No file uploaded", 400);

    return this.invoiceService.importFromCsv(id, csvContent, excludeIndexes);
  }
}
