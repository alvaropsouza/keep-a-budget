export interface IFixedExpense {
  id: string;
  _id: string;
  userId?: string | null;
  name: string;
  amount: number;
  description?: string;
  dueDay?: number; // Dia do vencimento (1-31)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
