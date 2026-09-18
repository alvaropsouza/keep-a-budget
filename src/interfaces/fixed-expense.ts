export interface IFixedExpense {
  id: string;
  _id: string;
  userId?: string | null;
  name: string;
  amount: number;
  description?: string;
  category?: string;
  dueDay?: number;
  recurrenceMonths: number;
  startDate?: Date | null;
  endDate?: Date | null;
  paymentMethodName?: string;
  autoLaunch: boolean;
  isActive: boolean;
  linkedInvoiceIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type FixedExpenseBlockedReason = "ALREADY_LINKED" | "NOT_STARTED" | "ENDED" | "OUT_OF_CYCLE";

export interface ILaunchableFixedExpense extends IFixedExpense {
  due: boolean;
  blockedReason?: FixedExpenseBlockedReason;
}
