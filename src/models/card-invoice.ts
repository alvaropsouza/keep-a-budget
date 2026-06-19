import { BanksEnum } from "../enums/banks.enum";
import { IExpense } from "./expense";

export interface ICardInvoice {
  id: string;
  _id: string;
  userId?: string;
  bank: BanksEnum;
  closingDate: Date;
  dueDate: Date;
  balance: number;
  advance: number;
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
  expenses?: IExpense[];
}
