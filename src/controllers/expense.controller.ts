import { FastifyRequest, FastifyReply } from "fastify";
import { BaseController } from "./base.controller";
import { ExpenseService } from "../services/expense.service";
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryParamsDto,
} from "../dto/expense.dto";

export class ExpenseController extends BaseController {
  private service: ExpenseService;

  constructor() {
    super();
    this.service = new ExpenseService();
  }

  getAll = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const filter = this.service.buildFilter(
        request.query as ExpenseQueryParamsDto,
      );
      const userId = request.authUser?.userId;
      const expenses = await this.service.getAllWithSignedReceipts(filter, userId);
      reply.send(expenses);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  getById = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const { id } = request.params as { id: string };
      const expense = await this.service.findById(id);

      // If expense has a receipt, generate signed URL
      if (expense.receipt) {
        const signedUrl = await this.service.getReceiptUrl(expense.receipt);
        (expense as any).receipt = signedUrl;
      }

      reply.send(expense);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  create = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      request.log.info(
        {
          reqId: request.id,
          contentType: request.headers["content-type"],
        },
        "Starting POST /expenses request",
      );

      const { body, file } = await this.parseRequest(request);

      request.log.debug(
        {
          reqId: request.id,
          bank: body.bank,
          category: body.category,
          amount: body.amount,
          installmentTotal: body.installmentTotal,
          installmentStartNumber: body.installmentStartNumber,
          hasFile: Boolean(file),
        },
        "Expense payload parsed successfully",
      );

      if (!(await this.validate(CreateExpenseDto, body, reply))) {
        request.log.warn(
          {
            reqId: request.id,
            bank: body.bank,
            category: body.category,
          },
          "Expense payload validation failed",
        );
        return;
      }

      const expense = await this.service.createExpense(
        { ...body, userId: request.authUser?.userId },
        file,
      );
      reply.status(201).send(expense);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  update = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      if (!(await this.validate(UpdateExpenseDto, request.body, reply))) {
        return;
      }

      const { id } = request.params as { id: string };
      const expense = await this.service.updateExpense(id, request.body as any);
      reply.send(expense);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  delete = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const { id } = request.params as { id: string };
      await this.service.deleteExpense(id);
      reply.send({ message: "Expense deleted successfully" });
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  uploadReceipt = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const { id } = request.params as { id: string };

      let fileBuffer: Buffer | undefined;
      let filename: string | undefined;
      let mimetype: string | undefined;
      let userEmail: string | undefined;

      const parts = request.parts();
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
        reply.status(400).send({ error: "No file uploaded" });
        return;
      }

      const file = { buffer: fileBuffer, filename, mimetype, userEmail };

      await this.service.uploadReceipt(id, file);
      const expense = await this.service.findById(id);

      // Generate signed URL for the uploaded receipt
      if (expense.receipt) {
        const signedUrl = await this.service.getReceiptUrl(expense.receipt);
        (expense as any).receipt = signedUrl;
      }

      reply.send(expense);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  deleteReceipt = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const { id } = request.params as { id: string };
      await this.service.deleteReceipt(id);
      reply.send({ message: "Receipt removed successfully" });
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  private async parseRequest(request: FastifyRequest) {
    const contentType = request.headers["content-type"];
    let body: CreateExpenseDto;
    let file:
      | { buffer: Buffer; filename: string; mimetype: string }
      | undefined;

    if (contentType?.includes("multipart/form-data")) {
      request.log.debug(
        {
          reqId: request.id,
          contentType,
        },
        "Parsing multipart expense payload",
      );
      const parts = request.parts();
      const formFields: Record<string, string> = {};

      for await (const part of parts) {
        if (part.type === "field") {
          formFields[part.fieldname] = part.value as string;
        } else if (part.type === "file") {
          request.log.debug(
            {
              reqId: request.id,
              filename: part.filename,
              mimetype: part.mimetype,
            },
            "Reading uploaded expense file",
          );
          const buffer = await part.toBuffer();
          file = {
            buffer,
            filename: part.filename,
            mimetype: part.mimetype,
          };
        }
      }

      body = {
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
      };
    } else {
      request.log.debug(
        {
          reqId: request.id,
          contentType,
        },
        "Using JSON expense payload",
      );
      body = request.body as CreateExpenseDto;
    }

    return { body, file };
  }
}

const expenseController = new ExpenseController();
export const {
  getAll: getAllExpenses,
  getById: getExpenseById,
  create: createExpense,
  update: updateExpense,
  delete: deleteExpense,
  uploadReceipt,
  deleteReceipt,
} = expenseController;
