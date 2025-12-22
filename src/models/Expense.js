const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
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
    default: '',
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CardInvoice',
    default: null,
  },
}, {
  timestamps: true, // This automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Expense', expenseSchema);
