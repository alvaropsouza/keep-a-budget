import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  advanceInvoice,
  closeInvoice,
  reopenInvoice,
  importInvoiceCsv,
  createInvoiceFromCsv,
} from "../controllers/invoice.controller";
import { SessionAuthGuard } from "./session-auth.guard";

@UseGuards(SessionAuthGuard)
@Controller("invoices")
export class InvoicesHttpController {
  @Get()
  async getAll(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    await getAllInvoices(req, reply);
  }

  @Get(":id")
  async getById(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await getInvoiceById(req, reply);
  }

  @Post()
  async create(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    await createInvoice(req, reply);
  }

  @Post("create-from-csv")
  async createFromCsv(
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await createInvoiceFromCsv(req, reply);
  }

  @Put(":id")
  async update(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await updateInvoice(req, reply);
  }

  @Delete(":id")
  async delete(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await deleteInvoice(req, reply);
  }

  @Post(":id/advance")
  async advance(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await advanceInvoice(req, reply);
  }

  @Post(":id/close")
  async close(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await closeInvoice(req, reply);
  }

  @Post(":id/reopen")
  async reopen(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await reopenInvoice(req, reply);
  }

  @Post(":id/import-csv")
  async importCsv(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await importInvoiceCsv(req, reply);
  }
}
