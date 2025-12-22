import mongoose, { Schema, Document } from "mongoose";
import { BanksEnum } from "../enums/banks.enum";

export interface IExpense extends Document {
  bank: BanksEnum;
  category: string;
  date: Date;
  amount: number;
  description?: string;
  receipt?: string;
  installment?: {
    current?: number;
    total?: number;
  };
  cardInvoiceId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    bank: {
      type: String,
      enum: Object.values(BanksEnum),
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    receipt: {
      type: String,
      default: null,
    },
    installment: {
      current: {
        type: Number,
        default: null,
      },
      total: {
        type: Number,
        default: null,
      },
    },
    cardInvoiceId: {
      type: Schema.Types.ObjectId,
      ref: "CardInvoice",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IExpense>("Expense", expenseSchema);
