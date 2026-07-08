import type { PaymentMethodTypeEnum } from "../enums/payment-method-type.enum";

export interface IPaymentMethod {
  id: string;
  _id: string;
  userId: string;
  name: string;
  type: PaymentMethodTypeEnum;
  color?: string;
  closingDay?: number;
  dueDay?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
