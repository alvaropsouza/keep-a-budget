import { IExpense } from "../../../models/Expense";

export interface CreateExpenseDto
  extends Omit<IExpense, "createdAt" | "updatedAt"> {
  installmentTotal?: number;
  installmentStartDate?: string;
}

export interface UpdateExpenseDto extends Partial<CreateExpenseDto> {}

export interface ExpenseQueryParamsDto {
  bank?: string;
  category?: string;
  cardInvoiceId?: string;
  minAmount?: string;
  maxAmount?: string;
  createdStartDate?: string;
  createdEndDate?: string;
  updatedStartDate?: string;
  updatedEndDate?: string;
}
