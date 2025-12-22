import mongoose, { Schema, Document } from "mongoose";

export interface IExpense extends Document {
  bank: string;
  category: string;
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
      required: true,
    },
    category: {
      type: String,
      required: true,
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
      type: String, // S3 URL
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
    timestamps: true, // This automatically adds createdAt and updatedAt fields
  }
);

export default mongoose.model<IExpense>("Expense", expenseSchema);
