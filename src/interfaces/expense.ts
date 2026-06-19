import { BanksEnum } from "../enums/banks.enum";
import { ExpenseTypeEnum } from "../enums/expense-type.enum";

export interface IExpense {
  id: string;
  _id: string;
  userId?: string;
  bank: BanksEnum;
  type: ExpenseTypeEnum;
  category: string;
  date: Date;
  amount: number;
  description?: string;
  receipt?: string;
  irDeductible: boolean;
  installment?: {
    current?: number;
    total?: number;
  };
  cardInvoiceId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
