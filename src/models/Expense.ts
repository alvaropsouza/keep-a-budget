import { BanksEnum } from "../enums/banks.enum";
import { ExpenseTypeEnum } from "../enums/expenseType.enum";

export interface IExpense {
  id: string;
  _id: string;
  bank: BanksEnum;
  type: ExpenseTypeEnum;
  category: string;
  date: Date;
  amount: number;
  description?: string;
  receipt?: string;
  installment?: {
    current?: number;
    total?: number;
  };
  cardInvoiceId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
