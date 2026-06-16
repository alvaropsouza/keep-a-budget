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
import { SessionAuthGuard } from "./session-auth.guard";
import { AppError } from "../utils/AppError";
import { validateDto } from "../utils/validation";

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
  async getById(@Param("id") id: string) {
    const expense = await this.expenseService.findById(id);
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
  async update(@Param("id") id: string, @Body() body: UpdateExpenseDto) {
    return this.expenseService.updateExpense(id, body);
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    await this.expenseService.deleteExpense(id);
    return { message: "Expense deleted successfully" };
  }

  @Patch(":id/ir")
  async toggleIrDeductible(@Param("id") id: string, @Body() body: IrToggleDto) {
    return this.expenseService.updateExpense(id, { irDeductible: body.irDeductible });
  }

  @Post(":id/receipt")
  async uploadReceipt(@Param("id") id: string, @Req() req: FastifyRequest) {
    let fileBuffer: Buffer | undefined;
    let filename: string | undefined;
    let mimetype: string | undefined;
    let userEmail: string | undefined;

    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === "field" && part.fieldname === "userEmail") {
        userEmail = part.value as string;
      } else if (part.type === "file") {
        fileBuffer = await part.toBuffer();
        filename = part.filename;
        mimetype = part.mimetype;
      }
    }

    if (!fileBuffer || !filename || !mimetype) {
      throw new AppError("No file uploaded", 400);
    }

    await this.expenseService.uploadReceipt(id, {
      buffer: fileBuffer,
      filename,
      mimetype,
      userEmail,
    });

    const expense = await this.expenseService.findById(id);
    if (expense.receipt) {
      const signedUrl = await this.expenseService.getReceiptUrl(expense.receipt);
      return { ...expense, receipt: signedUrl };
    }
    return expense;
  }

  @Delete(":id/receipt")
  async deleteReceipt(@Param("id") id: string) {
    await this.expenseService.deleteReceipt(id);
    return { message: "Receipt removed successfully" };
  }

  private async parseMultipartOrJson(req: FastifyRequest): Promise<{
    body: CreateExpenseDto;
    file?: { buffer: Buffer; filename: string; mimetype: string };
  }> {
    const contentType = req.headers["content-type"];
    if (contentType?.includes("multipart/form-data")) {
      const formFields: Record<string, string> = {};
      let file: { buffer: Buffer; filename: string; mimetype: string } | undefined;

      const parts = req.parts();
      for await (const part of parts) {
        if (part.type === "field") {
          formFields[part.fieldname] = part.value as string;
        } else if (part.type === "file") {
          const buffer = await part.toBuffer();
          file = { buffer, filename: part.filename, mimetype: part.mimetype };
        }
      }

      const body: CreateExpenseDto = {
        bank: formFields.bank as any,
        category: formFields.category,
        amount: Number.parseFloat(formFields.amount),
        description: formFields.description,
        installmentTotal: formFields.installmentTotal
          ? Number.parseInt(formFields.installmentTotal)
          : undefined,
        installmentStartNumber: formFields.installmentStartNumber
          ? Number.parseInt(formFields.installmentStartNumber)
          : undefined,
        installmentStartDate: formFields.installmentStartDate,
        receipt: formFields.receipt,
        irDeductible: formFields.irDeductible === "true",
      };

      return { body, file };
    }

    return { body: req.body as CreateExpenseDto };
  }
}
