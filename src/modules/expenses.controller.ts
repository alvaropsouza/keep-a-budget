import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Patch,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";
import { ExpenseService } from "../services/expense.service";
import { IrDocumentService } from "../services/ir-document.service";
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryParamsDto,
  IrQueryParamsDto,
  IrToggleDto,
} from "../dto/expense.dto";
import { BanksEnum } from "../enums/banks.enum";
import { SessionAuthGuard } from "./session-auth.guard";
import { AppError } from "../utils/AppError";
import { validateDto } from "../utils/validation";
import { validateUpload, RECEIPT_UPLOAD_RULES } from "../utils/validateUpload";
import { readMultipart } from "../utils/readMultipart";

@UseGuards(SessionAuthGuard)
@Controller("expenses")
export class ExpensesController {
  constructor(
    @Inject(ExpenseService) private readonly expenseService: ExpenseService,
    @Inject(IrDocumentService) private readonly irDocumentService: IrDocumentService,
  ) {}

  @Get()
  async getAll(@Query() query: ExpenseQueryParamsDto, @Req() req: FastifyRequest) {
    const filter = this.expenseService.buildFilter(query);
    return this.expenseService.getAllWithSignedReceipts(filter, req.authUser!.userId);
  }

  @Get("ir")
  async getIrExpenses(@Query() query: IrQueryParamsDto, @Req() req: FastifyRequest) {
    const year = Number(query.year);
    return this.expenseService.getIrExpensesWithSignedReceipts(year, req.authUser!.userId);
  }

  @Get("ir/summary")
  async getIrSummary(@Query() query: IrQueryParamsDto, @Req() req: FastifyRequest) {
    const year = Number(query.year);
    return this.expenseService.getIrSummary(year, req.authUser!.userId);
  }

  @Get("ir/export")
  async exportIrZip(
    @Query() query: IrQueryParamsDto,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    const year = Number(query.year);
    const userId = req.authUser!.userId;
    const irDocuments = await this.irDocumentService.listByYear(year, userId);
    const zipBuffer = await this.expenseService.exportIrZip(year, userId, irDocuments);

    reply
      .header("Content-Type", "application/zip")
      .header("Content-Disposition", `attachment; filename="documentos-ir-${year}.zip"`)
      .send(zipBuffer);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @Req() req: FastifyRequest) {
    const expense = await this.expenseService.findById(id, undefined, req.authUser!.userId);
    if (expense.receipt) {
      const signedUrl = await this.expenseService.getReceiptUrl(expense.receipt);
      return { ...expense, receipt: signedUrl };
    }
    return expense;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: FastifyRequest) {
    const { body, file } = await this.parseMultipartOrJson(req);
    const { valid, errors } = await validateDto(CreateExpenseDto, body);
    if (!valid) throw new AppError("Validation failed", 400, errors);
    return this.expenseService.createExpense(
      { ...body, userId: req.authUser!.userId },
      file,
    );
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: UpdateExpenseDto, @Req() req: FastifyRequest) {
    return this.expenseService.updateExpense(id, body, req.authUser!.userId);
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: FastifyRequest) {
    await this.expenseService.deleteExpense(id, req.authUser!.userId);
    return { message: "Expense deleted successfully" };
  }

  @Patch(":id/ir")
  async toggleIrDeductible(@Param("id") id: string, @Body() body: IrToggleDto, @Req() req: FastifyRequest) {
    return this.expenseService.updateExpense(id, { irDeductible: body.irDeductible }, req.authUser!.userId);
  }

  @Post(":id/receipt")
  async uploadReceipt(@Param("id") id: string, @Req() req: FastifyRequest) {
    const { fields, file } = await readMultipart(req);

    if (!file) {
      throw new AppError("No file uploaded", 400);
    }

    const detectedMime = validateUpload(file.buffer, RECEIPT_UPLOAD_RULES);

    await this.expenseService.uploadReceipt(id, {
      buffer: file.buffer,
      filename: file.filename,
      mimetype: detectedMime,
      userEmail: fields.userEmail,
    }, req.authUser!.userId);

    const expense = await this.expenseService.findById(id, undefined, req.authUser!.userId);
    if (expense.receipt) {
      const signedUrl = await this.expenseService.getReceiptUrl(expense.receipt);
      return { ...expense, receipt: signedUrl };
    }
    return expense;
  }

  @Delete(":id/receipt")
  async deleteReceipt(@Param("id") id: string, @Req() req: FastifyRequest) {
    await this.expenseService.deleteReceipt(id, req.authUser!.userId);
    return { message: "Receipt removed successfully" };
  }

  private async parseMultipartOrJson(req: FastifyRequest): Promise<{
    body: CreateExpenseDto;
    file?: { buffer: Buffer; filename: string; mimetype: string };
  }> {
    const contentType = req.headers["content-type"];
    if (contentType?.includes("multipart/form-data")) {
      const { fields, file } = await readMultipart(req);

      const body: CreateExpenseDto = {
        bank: fields.bank as BanksEnum,
        category: fields.category,
        amount: Number.parseFloat(fields.amount),
        description: fields.description,
        installmentTotal: fields.installmentTotal
          ? Number.parseInt(fields.installmentTotal)
          : undefined,
        installmentStartNumber: fields.installmentStartNumber
          ? Number.parseInt(fields.installmentStartNumber)
          : undefined,
        installmentStartDate: fields.installmentStartDate,
        receipt: fields.receipt,
        irDeductible: fields.irDeductible === "true",
      };

      return { body, file };
    }

    return { body: req.body as CreateExpenseDto };
  }
}
