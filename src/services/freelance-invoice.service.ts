import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "../lib/prisma";
import {
  CreateFreelanceInvoiceDto,
  UpdateFreelanceInvoiceDto,
} from "../dto/freelance-invoice.dto";
import { Invoice, InvoiceItem, Prisma } from "../generated/prisma/client/client";

@Injectable()
export class FreelanceInvoiceService {
  constructor() {}

  /**
   * Gera número da invoice sequencial com formato INV-XXXXXX
   */
  private async generateInvoiceNumber(): Promise<string> {
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `INV-${String(nextNumber).padStart(6, "0")}`;
  }

  /**
   * Cria uma nova invoice
   */
  async create(userId: string, dto: CreateFreelanceInvoiceDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("Invoice deve ter pelo menos um item");
    }

    const invoiceNumber = await this.generateInvoiceNumber();

    // Calcula total dos itens
    const total = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        userId,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail,
        issueDate: new Date(dto.issueDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: "draft",
        total,
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return this.formatInvoiceResponse(invoice);
  }

  /**
   * Lista invoices do usuário
   */
  async listByUser(userId: string, status?: string) {
    const where: Prisma.InvoiceWhereInput = { userId };
    if (status) {
      where.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return invoices.map((inv) => this.formatInvoiceResponse(inv));
  }

  /**
   * Obtém uma invoice específica
   */
  async getById(id: string, userId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!invoice) {
      throw new NotFoundException("Invoice não encontrada");
    }

    return this.formatInvoiceResponse(invoice);
  }

  /**
   * Atualiza invoice
   */
  async update(id: string, userId: string, dto: UpdateFreelanceInvoiceDto) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!invoice) {
      throw new NotFoundException("Invoice não encontrada");
    }

    let total: number = Number(invoice.total);

    // Se items são atualizados, recalcula total
    if (dto.items && dto.items.length > 0) {
      // Remove itens antigos
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Calcula novo total
      total = dto.items.reduce((sum, item) => {
        const qty = item.quantity ?? 1;
        const price = item.unitPrice ?? 0;
        return sum + qty * price;
      }, 0);

      // Cria novos itens
      await prisma.invoiceItem.createMany({
        data: dto.items.map((item) => ({
          invoiceId: id,
          description: item.description || "",
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? 0,
          total: (item.quantity ?? 1) * (item.unitPrice ?? 0),
        })),
      });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        clientName: dto.clientName,
        clientEmail: dto.clientEmail,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: dto.status,
        total: dto.items ? total : undefined,
        notes: dto.notes,
      },
      include: { items: true },
    });

    return this.formatInvoiceResponse(updated);
  }

  /**
   * Deleta uma invoice
   */
  async delete(id: string, userId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
    });

    if (!invoice) {
      throw new NotFoundException("Invoice não encontrada");
    }

    await prisma.invoice.delete({
      where: { id },
    });
  }

  /**
   * Muda status da invoice (draft → sent → paid)
   */
  async changeStatus(id: string, userId: string, status: string) {
    const validStatuses = ["draft", "sent", "paid"];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Status inválido. Deve ser um de: ${validStatuses.join(", ")}`
      );
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!invoice) {
      throw new NotFoundException("Invoice não encontrada");
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: { items: true },
    });

    return this.formatInvoiceResponse(updated);
  }

  /**
   * Formata resposta da invoice
   */
  private formatInvoiceResponse(
    invoice: Invoice & { items: InvoiceItem[] }
  ) {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      issueDate: invoice.issueDate.toISOString().split("T")[0],
      dueDate: invoice.dueDate
        ? invoice.dueDate.toISOString().split("T")[0]
        : null,
      status: invoice.status,
      total: Number(invoice.total),
      notes: invoice.notes,
      items: invoice.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    };
  }
}
