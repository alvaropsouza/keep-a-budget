import { BanksEnum } from "../enums/banks.enum";

export interface ICardInvoice {
  id: string;
  _id: string;
  bank: BanksEnum;
  closingDate: Date;
  dueDate: Date;
  balance: number;
  advance: number;
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
  expenses?: any[];
}
