export type StockTransactionType = "COMPRA" | "VENDA";
export type StockOperationType = "NORMAL" | "DAY_TRADE";

export interface IStockTransaction {
  id: string;
  userId: string;
  ticker: string;
  companyName: string;
  cnpj?: string;
  broker: string;
  date: Date;
  type: StockTransactionType;
  operationType: StockOperationType;
  quantity: number;
  unitPrice: number;
  fees: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStockPosition {
  ticker: string;
  companyName: string;
  cnpj?: string;
  broker: string;
  quantity: number;
  averageCost: number;
  totalCost: number;
}

export interface IStockMonthlyGain {
  month: number;
  year: number;
  operationType: StockOperationType;
  grossRevenue: number;
  netGain: number;
  isExempt: boolean;
}
