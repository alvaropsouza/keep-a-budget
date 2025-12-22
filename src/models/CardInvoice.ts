import mongoose, { Schema, Document } from "mongoose";

export interface ICardInvoice extends Document {
  invoiceDate: Date;
  bank: "NUBANK" | "XP";
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
      enum: ["NUBANK", "XP"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICardInvoice>("CardInvoice", cardInvoiceSchema);
