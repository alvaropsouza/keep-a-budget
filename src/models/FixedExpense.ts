import mongoose, { Schema, Document } from "mongoose";

export interface IFixedExpense extends Document {
  userId?: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  description?: string;
  dueDay?: number; // Dia do vencimento (1-31)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const fixedExpenseSchema = new Schema<IFixedExpense>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    dueDay: {
      type: Number,
      min: 1,
      max: 31,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index para melhorar performance de queries
fixedExpenseSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model<IFixedExpense>(
  "FixedExpense",
  fixedExpenseSchema,
);
