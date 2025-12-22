import mongoose, { Schema, Document } from "mongoose";
import { BanksEnum } from "../enums/banks.enum";

export interface ICardInvoice extends Document {
  invoiceDate: Date;
  bank: BanksEnum;
  createdAt: Date;
  updatedAt: Date;
}

const cardInvoiceSchema = new Schema<ICardInvoice>(
  {
    invoiceDate: {
      type: Date,
      required: true,
    },
    bank: {
      type: String,
      enum: Object.values(BanksEnum),
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICardInvoice>("CardInvoice", cardInvoiceSchema);
