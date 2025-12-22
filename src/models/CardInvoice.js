const mongoose = require('mongoose');

const cardInvoiceSchema = new mongoose.Schema({
  invoiceDate: {
    type: Date,
    required: true,
  },
  bank: {
    type: String,
    enum: ['NUBANK', 'XP'],
    required: true,
  },
}, {
  timestamps: true, // This automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('CardInvoice', cardInvoiceSchema);
