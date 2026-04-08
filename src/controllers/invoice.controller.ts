import { FastifyRequest, FastifyReply } from "fastify";
import { BaseController } from "./base.controller";
import { InvoiceService } from "../services/invoice.service";
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceQueryParamsDto,
  AdvanceInvoiceDto,
  CloseInvoiceDto,
} from "../dto/invoice.dto";
import { BanksEnum } from "../enums/banks.enum";

export class InvoiceController extends BaseController {
  private service: InvoiceService;

  constructor() {
    super();
    this.service = new InvoiceService();
  }

  getAll = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const filter = this.service.buildFilter(
        request.query as InvoiceQueryParamsDto,
      );
      const invoices = await this.service.getAllWithExpenses(filter);
      reply.send(invoices);
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
      const invoice = await this.service.getByIdWithExpenses(id);
      reply.send(invoice);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  create = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      if (!(await this.validate(CreateInvoiceDto, request.body, reply))) {
        return;
      }

      const invoice = await this.service.createInvoice(request.body as any);
      reply.status(201).send(invoice);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  update = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      if (!(await this.validate(UpdateInvoiceDto, request.body, reply))) {
        return;
      }

      const { id } = request.params as { id: string };
      const invoice = await this.service.update(id, request.body as any);
      reply.send(invoice);
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
      await this.service.deleteWithExpenses(id);
      reply.send({
        message: "Invoice and associated expenses deleted successfully",
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  advance = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      if (!(await this.validate(AdvanceInvoiceDto, request.body, reply))) {
        return;
      }

      const { id } = request.params as { id: string };
      const { amount } = request.body as AdvanceInvoiceDto;
      const invoice = await this.service.advancePayment(id, amount);
      reply.send(invoice);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  close = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      if (!(await this.validate(CloseInvoiceDto, request.body, reply))) {
        return;
      }

      const { id } = request.params as { id: string };
      const { balance } = request.body as CloseInvoiceDto;
      const invoice = await this.service.closeInvoice(id, balance);
      reply.send(invoice);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  reopen = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const { id } = request.params as { id: string };
      const invoice = await this.service.reopenInvoice(id);
      reply.send(invoice);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  importCsv = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const { id } = request.params as { id: string };
      const parts = request.parts();
      let csvContent: string | null = null;
      let excludeIndexes: number[] | undefined;

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
          if (
            !part.mimetype.includes("csv") &&
            !part.filename.endsWith(".csv")
          ) {
            reply.status(400).send({ error: "Only CSV files are accepted" });
            return;
          }
          const buffer = await part.toBuffer();
          csvContent = buffer.toString("utf-8");
        }
      }

      if (!csvContent) {
        reply.status(400).send({ error: "No file uploaded" });
        return;
      }

      const invoice = await this.service.importFromCsv(
        id,
        csvContent,
        excludeIndexes,
      );
      reply.send(invoice);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  createFromCsv = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const parts = request.parts();
      let csvContent: string | null = null;
      let closingDate: string | null = null;
      let dueDate: string | null = null;
      let bank: BanksEnum | null = null;
      let excludeIndexes: number[] | undefined;

      for await (const part of parts) {
        if (part.type === "field") {
          if (part.fieldname === "closingDate")
            closingDate = part.value as string;
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
          if (
            !part.filename.endsWith(".csv") &&
            !part.mimetype.includes("csv")
          ) {
            reply.status(400).send({ error: "Only CSV files are accepted" });
            return;
          }
          const buffer = await part.toBuffer();
          csvContent = buffer.toString("utf-8");
        }
      }

      if (!csvContent) {
        reply.status(400).send({ error: "No CSV file uploaded" });
        return;
      }
      if (!closingDate || !dueDate) {
        reply
          .status(400)
          .send({ error: "closingDate and dueDate are required" });
        return;
      }
      if (!bank) {
        reply.status(400).send({ error: "bank is required" });
        return;
      }

      const invoice = await this.service.createFromCsv(
        bank,
        closingDate,
        dueDate,
        csvContent,
        excludeIndexes,
      );
      reply.status(201).send(invoice);
    } catch (error) {
      this.handleError(error, reply);
    }
  };
}

// Export singleton instance
const invoiceController = new InvoiceController();
export const {
  getAll: getAllInvoices,
  getById: getInvoiceById,
  create: createInvoice,
  update: updateInvoice,
  delete: deleteInvoice,
  advance: advanceInvoice,
  close: closeInvoice,
  reopen: reopenInvoice,
  importCsv: importInvoiceCsv,
  createFromCsv: createInvoiceFromCsv,
} = invoiceController;
