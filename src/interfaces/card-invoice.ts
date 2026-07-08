import { IExpense } from "./expense";
import { InvoiceStatusEnum } from "../enums/invoice-status.enum";

export interface ICardInvoice {
  id: string;
  _id: string;
  userId?: string;
  bank: string;
  closingDate: Date;
  dueDate: Date;
  balance: number;
  advance: number;
  status: InvoiceStatusEnum;
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
  expenses?: IExpense[];
}
