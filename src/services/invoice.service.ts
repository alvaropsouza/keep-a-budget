import { BaseService } from "./base.service";
import CardInvoice, { ICardInvoice } from "../models/CardInvoice";
import Expense from "../models/Expense";
import { ExpenseTypeEnum } from "../enums/expenseType.enum";
import { FilterBuilder } from "../utils/filterBuilder";
import logger from "../config/logger";
import { AppError } from "../utils/AppError";
import { InvoiceQueryParamsDto } from "../dto/invoice.dto";
import { BanksEnum } from "../enums/banks.enum";

export class InvoiceService extends BaseService<ICardInvoice> {
  constructor() {
    super(CardInvoice);
  }

  private addMonthsClamped(date: Date, months: number): Date {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    const target = new Date(Date.UTC(year, month + months, day));
    if (target.getUTCDate() !== day) {
      target.setUTCDate(0);
    }

    return target;
  }

  private async getLatestInvoice(bank: string): Promise<ICardInvoice | null> {
    return CardInvoice.findOne({ bank }).sort({ closingDate: -1 }).exec();
  }

  private async safeCreateInvoice(
    bank: string,
    closingDate: Date,
    dueDate: Date,
  ): Promise<ICardInvoice> {
    try {
      return await this.createInvoice({
        bank: bank as BanksEnum,
        closingDate,
        dueDate,
        balance: 0,
      });
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 409) {
        const existing = await CardInvoice.findOne({
          bank,
          closingDate,
        }).exec();
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  buildFilter(queryParams: InvoiceQueryParamsDto): Record<string, unknown> {
    return new FilterBuilder()
      .addEquals("bank", queryParams.bank)
      .addDate("closingDate", queryParams.closingDate)
      .addDate("dueDate", queryParams.dueDate)
      .addDateRange("closingDate", queryParams.startDate, queryParams.endDate)
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

  async checkDuplicate(bank: string, closingDate: string): Promise<boolean> {
    return this.exists({
      bank,
      closingDate: new Date(closingDate),
    });
  }

  async createInvoice(data: Partial<ICardInvoice>): Promise<ICardInvoice> {
    if (await this.checkDuplicate(data.bank!, data.closingDate!.toString())) {
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
      { $inc: { advance: amount, balance: -amount } },
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
      closingDate: { $gte: queryDate },
    })
      .sort({ closingDate: 1 })
      .exec();
  }

  async ensureInvoiceForDate(bank: string, date: Date): Promise<ICardInvoice> {
    const targetDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    const existingInvoice = await this.findForExpenseDate(bank, targetDate);
    if (existingInvoice) {
      return existingInvoice;
    }

    const latestInvoice = await this.getLatestInvoice(bank);
    if (!latestInvoice) {
      throw new AppError(
        `Nenhuma fatura cadastrada para o banco ${bank}. Crie a primeira fatura manualmente para definirmos o ciclo.`,
        400,
      );
    }

    let currentClosingDate = latestInvoice.closingDate;
    let currentDueDate = latestInvoice.dueDate;
    let createdInvoice: ICardInvoice | null = null;

    while (!createdInvoice || createdInvoice.closingDate < targetDate) {
      const nextClosingDate = this.addMonthsClamped(currentClosingDate, 1);
      const nextDueDate = this.addMonthsClamped(currentDueDate, 1);

      createdInvoice = await this.safeCreateInvoice(
        bank,
        nextClosingDate,
        nextDueDate,
      );

      currentClosingDate = createdInvoice.closingDate;
      currentDueDate = createdInvoice.dueDate;
    }

    return createdInvoice;
  }
}
