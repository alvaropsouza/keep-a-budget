import { BaseService } from "./base.service";
import CardInvoice, { ICardInvoice } from "../models/CardInvoice";
import Expense from "../models/Expense";
import { ExpenseTypeEnum } from "../enums/expenseType.enum";
import { FilterBuilder } from "../utils/filterBuilder";
import { InvoiceQueryParamsDto } from "../dto/invoice.dto";
import logger from "../config/logger";
import { AppError } from "../utils/AppError";

export class InvoiceService extends BaseService<ICardInvoice> {
  constructor() {
    super(CardInvoice);
  }

  buildFilter(queryParams: InvoiceQueryParamsDto): Record<string, unknown> {
    return new FilterBuilder()
      .addEquals("bank", queryParams.bank)
      .addDate("openDate", queryParams.openDate)
      .addDate("closingDate", queryParams.closingDate)
      .addDate("dueDate", queryParams.dueDate)
      .addDateRange("openDate", queryParams.startDate, queryParams.endDate)
      .addDateRange(
        "createdAt",
        queryParams.createdStartDate,
        queryParams.createdEndDate,
      )
      .addDateRange(
        "updatedAt",
        queryParams.updatedStartDate,
        queryParams.updatedEndDate,
      )
      .build();
  }

  async getAllWithExpenses(
    filter: Record<string, unknown>,
  ): Promise<ICardInvoice[]> {
    return CardInvoice.find(filter).sort({ dueDate: -1 }).populate("expenses");
  }

  async getByIdWithExpenses(id: string): Promise<ICardInvoice> {
    return this.findById(id, "expenses");
  }

  async checkDuplicate(
    bank: string,
    openDate: string,
    closingDate: string,
  ): Promise<boolean> {
    return this.exists({
      bank,
      openDate: new Date(openDate),
      closingDate: new Date(closingDate),
    });
  }

  async createInvoice(data: Partial<ICardInvoice>): Promise<ICardInvoice> {
    if (
      await this.checkDuplicate(
        data.bank!,
        data.openDate!.toString(),
        data.closingDate!.toString(),
      )
    ) {
      throw new AppError(
        "Invoice already exists for this bank and period",
        409,
      );
    }
    return this.create(data);
  }

  async deleteWithExpenses(id: string): Promise<void> {
    await this.delete(id);
    await Expense.deleteMany({ cardInvoiceId: id });
    logger.info({ invoiceId: id }, "Invoice and associated expenses deleted");
  }

  async advancePayment(id: string, amount: number): Promise<ICardInvoice> {
    const invoice = await this.getByIdWithExpenses(id);

    const currentBalance = invoice.balance ?? 0;
    const advancedAmount = invoice.advance ?? 0;
    const availableBalance = currentBalance - advancedAmount;

    if (amount > availableBalance) {
      throw new AppError(
        "Advance amount cannot exceed available balance",
        400,
        {
          currentBalance,
          advancedAmount,
          availableBalance,
          requestedAmount: amount,
        },
      );
    }

    const updatedInvoice = await CardInvoice.findByIdAndUpdate(
      id,
      { $inc: { advance: amount } },
      { new: true, runValidators: true },
    )
      .populate("expenses")
      .orFail();

    await Expense.create({
      bank: invoice.bank,
      type: ExpenseTypeEnum.ADVANCE,
      category: "Advance",
      amount,
      description: "Advance payment",
      date: new Date(),
      cardInvoiceId: invoice._id,
    });

    logger.info({ invoiceId: id, amount }, "Advance payment processed");
    return updatedInvoice;
  }

  async updateBalance(invoiceId: any, delta: number): Promise<void> {
    await CardInvoice.findByIdAndUpdate(invoiceId, {
      $inc: { balance: delta },
    });
    logger.debug({ invoiceId, delta }, "Invoice balance updated");
  }

  async findForExpenseDate(
    bank: string,
    date: Date,
  ): Promise<ICardInvoice | null> {
    const queryDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    return CardInvoice.findOne({
      bank,
      openDate: { $lte: queryDate },
      closingDate: { $gte: queryDate },
    });
  }
}
