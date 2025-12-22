export interface Invoice {
  _id: string;
  bank: "NUBANK" | "XP";
  openDate: string;
  closingDate: string;
  dueDate: string;
  amount: number;
  expenses?: Expense[];
}

export interface Expense {
  _id: string;
  bank: "NUBANK" | "XP";
  category: string;
  amount: number;
  description?: string;
  receipt?: string;
  installment?: {
    current: number;
    total: number;
  };
  cardInvoiceId?: string;
  createdDate?: string; // Assuming createdDate might be returned based on API docs mentioning createdStartDate filter
}

export interface CreateInvoiceDto {
  bank: "NUBANK" | "XP";
  openDate: string;
  closingDate: string;
  dueDate: string;
  amount?: number;
}

export interface CreateExpenseDto {
  bank: "NUBANK" | "XP";
  category: string;
  amount: number;
  description?: string;
  installmentTotal?: number;
  installmentStartDate?: string;
  file?: File;
}

export interface InvoiceFilters {
  bank?: string;
  startDate?: string;
  endDate?: string;
  openDate?: string;
  closingDate?: string;
  dueDate?: string;
}

export interface ExpenseFilters {
  bank?: string;
  category?: string;
  cardInvoiceId?: string;
  minAmount?: number;
  maxAmount?: number;
  createdStartDate?: string;
  createdEndDate?: string;
}
