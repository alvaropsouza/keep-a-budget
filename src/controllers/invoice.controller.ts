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
} = invoiceController;
