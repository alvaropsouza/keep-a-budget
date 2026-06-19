export interface IIrDocument {
  id: string;
  userId: string;
  date: Date;
  category: string;
  amount: number;
  description?: string;
  receipt: string;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}
