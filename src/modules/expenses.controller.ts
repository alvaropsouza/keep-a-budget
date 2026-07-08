import {
  Controller,
  Delete,
  Get,
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
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryParamsDto,
  IrQueryParamsDto,
  IrToggleDto,
} from "../dto/expense.dto";
import { ApiTags } from "@nestjs/swagger";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { AppError } from "../utils/app-error";
import { validateDto } from "../utils/validation";
import { validateUpload, RECEIPT_UPLOAD_RULES } from "../utils/validate-upload";
import { readMultipart } from "../utils/read-multipart";
import { ListExpensesUseCase } from "../use-cases/expenses/list-expenses.use-case";
import { GetExpenseByIdUseCase } from "../use-cases/expenses/get-expense-by-id.use-case";
import { CreateExpenseUseCase } from "../use-cases/expenses/create-expense.use-case";
import { UpdateExpenseUseCase } from "../use-cases/expenses/update-expense.use-case";
import { DeleteExpenseUseCase } from "../use-cases/expenses/delete-expense.use-case";
import { UploadExpenseReceiptUseCase } from "../use-cases/expenses/upload-expense-receipt.use-case";
import { DeleteExpenseReceiptUseCase } from "../use-cases/expenses/delete-expense-receipt.use-case";
import { ListIrExpensesUseCase } from "../use-cases/expenses/list-ir-expenses.use-case";
import { GetIrSummaryUseCase } from "../use-cases/expenses/get-ir-summary.use-case";
import { ExportIrZipUseCase } from "../use-cases/expenses/export-ir-zip.use-case";

@ApiTags("expenses")
@UseGuards(SessionAuthGuard)
@Controller("expenses")
export class ExpensesController {
  constructor(
    private readonly listExpensesUseCase: ListExpensesUseCase,
    private readonly getExpenseByIdUseCase: GetExpenseByIdUseCase,
    private readonly createExpenseUseCase: CreateExpenseUseCase,
    private readonly updateExpenseUseCase: UpdateExpenseUseCase,
    private readonly deleteExpenseUseCase: DeleteExpenseUseCase,
    private readonly uploadExpenseReceiptUseCase: UploadExpenseReceiptUseCase,
    private readonly deleteExpenseReceiptUseCase: DeleteExpenseReceiptUseCase,
    private readonly listIrExpensesUseCase: ListIrExpensesUseCase,
    private readonly getIrSummaryUseCase: GetIrSummaryUseCase,
    private readonly exportIrZipUseCase: ExportIrZipUseCase,
  ) {}

  @Get()
  async getAll(@Query() query: ExpenseQueryParamsDto, @Req() req: FastifyRequest) {
    return this.listExpensesUseCase.execute({ userId: this.authUserId(req), query });
  }

  @Get("ir")
  async getIrExpenses(@Query() query: IrQueryParamsDto, @Req() req: FastifyRequest) {
    return this.listIrExpensesUseCase.execute({ userId: this.authUserId(req), year: Number(query.year) });
  }

  @Get("ir/summary")
  async getIrSummary(@Query() query: IrQueryParamsDto, @Req() req: FastifyRequest) {
    return this.getIrSummaryUseCase.execute({ userId: this.authUserId(req), year: Number(query.year) });
  }

  @Get("ir/export")
  async exportIrZip(@Query() query: IrQueryParamsDto, @Req() req: FastifyRequest, @Res() reply: FastifyReply) {
    const year = Number(query.year);
    const zipBuffer = await this.exportIrZipUseCase.execute({ userId: this.authUserId(req), year });
    reply
      .header("Content-Type", "application/zip")
      .header("Content-Disposition", `attachment; filename="documentos-ir-${year}.zip"`)
      .send(zipBuffer);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @Req() req: FastifyRequest) {
    return this.getExpenseByIdUseCase.execute({ id, userId: this.authUserId(req) });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: FastifyRequest) {
    const { body, file } = await this.parseMultipartOrJson(req);
    const { valid, errors } = await validateDto(CreateExpenseDto, body);
    if (!valid) throw new AppError("Validation failed", 400, errors);
    return this.createExpenseUseCase.execute({ ...body, userId: this.authUserId(req), file });
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: UpdateExpenseDto, @Req() req: FastifyRequest) {
    return this.updateExpenseUseCase.execute({ ...body, id, userId: this.authUserId(req) });
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: FastifyRequest) {
    await this.deleteExpenseUseCase.execute({ id, userId: this.authUserId(req) });
    return { message: "Expense deleted successfully" };
  }

  @Patch(":id/ir")
  async toggleIrDeductible(@Param("id") id: string, @Body() body: IrToggleDto, @Req() req: FastifyRequest) {
    return this.updateExpenseUseCase.execute({ id, userId: this.authUserId(req), irDeductible: body.irDeductible });
  }

  @Post(":id/receipt")
  async uploadReceipt(@Param("id") id: string, @Req() req: FastifyRequest) {
    const { fields, file } = await readMultipart(req);
    if (!file) throw new AppError("No file uploaded", 400);
    const detectedMime = validateUpload(file.buffer, RECEIPT_UPLOAD_RULES);
    return this.uploadExpenseReceiptUseCase.execute({
      id,
      userId: this.authUserId(req),
      file: { buffer: file.buffer, filename: file.filename, mimetype: detectedMime, userEmail: fields.userEmail },
    });
  }

  @Delete(":id/receipt")
  async deleteReceipt(@Param("id") id: string, @Req() req: FastifyRequest) {
    await this.deleteExpenseReceiptUseCase.execute({ id, userId: this.authUserId(req) });
    return { message: "Receipt removed successfully" };
  }

  private authUserId(req: FastifyRequest): string {
    if (!req.authUser) throw new AppError("Unauthorized", 401);
    return req.authUser.userId;
  }

  private async parseMultipartOrJson(req: FastifyRequest): Promise<{
    body: CreateExpenseDto;
    file?: { buffer: Buffer; filename: string; mimetype: string };
  }> {
    const contentType = req.headers["content-type"];
    if (contentType?.includes("multipart/form-data")) {
      const { fields, file } = await readMultipart(req);
      const body: CreateExpenseDto = {
        bank: fields.bank,
        category: fields.category,
        amount: Number.parseFloat(fields.amount),
        description: fields.description,
        installmentTotal: fields.installmentTotal ? Number.parseInt(fields.installmentTotal) : undefined,
        installmentStartNumber: fields.installmentStartNumber ? Number.parseInt(fields.installmentStartNumber) : undefined,
        installmentStartDate: fields.installmentStartDate,
        receipt: fields.receipt,
        irDeductible: fields.irDeductible === "true",
      };
      return { body, file };
    }
    return { body: req.body as CreateExpenseDto };
  }
}
