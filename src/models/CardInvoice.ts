import mongoose, { Schema, Document } from "mongoose";
import { BanksEnum } from "../enums/banks.enum";

export interface ICardInvoice extends Document {
  bank: BanksEnum;
  openDate: Date;
  closingDate: Date;
  dueDate: Date;
  balance: number;
  advance: number;
  createdAt: Date;
  updatedAt: Date;
  expenses?: any[];
}

const cardInvoiceSchema = new Schema<ICardInvoice>(
  {
    bank: {
      type: String,
      enum: Object.values(BanksEnum),
      required: true,
    },
    openDate: {
      type: Date,
      required: true,
    },
    closingDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    balance: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },
    advance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Prevent multiple invoices for the same bank and period
cardInvoiceSchema.index(
  { bank: 1, openDate: 1, closingDate: 1 },
  { unique: true },
);

// Virtual for expenses relationship
cardInvoiceSchema.virtual("expenses", {
  ref: "Expense",
  localField: "_id",
  foreignField: "cardInvoiceId",
});

export default mongoose.model<ICardInvoice>("CardInvoice", cardInvoiceSchema);
