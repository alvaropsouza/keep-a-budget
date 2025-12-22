import mongoose, { Schema, Document } from "mongoose";
import { BanksEnum } from "../enums/banks.enum";

export interface ICardInvoice extends Document {
  bank: BanksEnum;
  openDate: Date;
  closingDate: Date;
  dueDate: Date;
  amount?: number;
  createdAt: Date;
  updatedAt: Date;
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
    amount: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent multiple invoices for the same bank and period
cardInvoiceSchema.index(
  { bank: 1, openDate: 1, closingDate: 1 },
  { unique: true }
);

cardInvoiceSchema.virtual("expenses", {
  ref: "Expense",
  localField: "_id",
  foreignField: "cardInvoiceId",
});

export default mongoose.model<ICardInvoice>("CardInvoice", cardInvoiceSchema);
