import { FastifyRequest, FastifyReply } from "fastify";
import { BaseController } from "./base.controller";
import { ExpenseService } from "../services/expense.service";
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryParamsDto,
} from "../dto/expense.dto";
import logger from "../config/logger";

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
      const expenses = await this.service.getAll(filter);
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
      const { body, file } = await this.parseRequest(request);

      if (!(await this.validate(CreateExpenseDto, body, reply))) {
        return;
      }

      const expense = await this.service.createExpense(body, file);
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
      const data = await request.file();

      if (!data) {
        reply.status(400).send({ error: "No file uploaded" });
        return;
      }

      const buffer = await data.toBuffer();
      const file = {
        buffer,
        filename: data.filename,
        mimetype: data.mimetype,
      };

      await this.service.uploadReceipt(id, file);
      const expense = await this.service.findById(id);
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
      logger.debug("Parsing multipart form data");
      const parts = request.parts();
      const formFields: Record<string, string> = {};

      for await (const part of parts) {
        if (part.type === "field") {
          formFields[part.fieldname] = part.value as string;
        } else if (part.type === "file") {
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
        installmentStartDate: formFields.installmentStartDate,
        receipt: formFields.receipt,
      };
    } else {
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
