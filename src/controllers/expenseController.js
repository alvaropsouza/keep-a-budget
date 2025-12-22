const Expense = require('../models/Expense');
const { uploadToS3 } = require('../utils/s3Upload');

// Helper function to build filter query
const buildFilterQuery = (queryParams) => {
  const filter = {};

  // Filter by bank
  if (queryParams.bank) {
    filter.bank = queryParams.bank;
  }

  // Filter by category
  if (queryParams.category) {
    filter.category = queryParams.category;
  }

  // Filter by cardInvoiceId
  if (queryParams.cardInvoiceId) {
    filter.cardInvoiceId = queryParams.cardInvoiceId;
  }

  // Filter by amount range
  if (queryParams.minAmount || queryParams.maxAmount) {
    filter.amount = {};
    if (queryParams.minAmount) {
      filter.amount.$gte = parseFloat(queryParams.minAmount);
    }
    if (queryParams.maxAmount) {
      filter.amount.$lte = parseFloat(queryParams.maxAmount);
    }
  }

  // Created at date range
  if (queryParams.createdStartDate || queryParams.createdEndDate) {
    filter.createdAt = {};
    if (queryParams.createdStartDate) {
      filter.createdAt.$gte = new Date(queryParams.createdStartDate);
    }
    if (queryParams.createdEndDate) {
      filter.createdAt.$lte = new Date(queryParams.createdEndDate);
    }
  }

  // Updated at date range
  if (queryParams.updatedStartDate || queryParams.updatedEndDate) {
    filter.updatedAt = {};
    if (queryParams.updatedStartDate) {
      filter.updatedAt.$gte = new Date(queryParams.updatedStartDate);
    }
    if (queryParams.updatedEndDate) {
      filter.updatedAt.$lte = new Date(queryParams.updatedEndDate);
    }
  }

  return filter;
};

// Helper function to create installment expenses
const createInstallmentExpenses = async (baseExpense, installmentTotal) => {
  const expenses = [];
  const baseDate = new Date();

  for (let i = 1; i <= installmentTotal; i++) {
    const installmentDate = new Date(baseDate);
    installmentDate.setMonth(baseDate.getMonth() + (i - 1));

    const expense = new Expense({
      ...baseExpense,
      installment: {
        current: i,
        total: installmentTotal,
      },
      createdAt: installmentDate,
    });

    await expense.save();
    expenses.push(expense);
  }

  return expenses;
};

// Get all expenses with optional filters
const getAllExpenses = async (request, reply) => {
  try {
    const filter = buildFilterQuery(request.query);
    const expenses = await Expense.find(filter)
      .populate('cardInvoiceId')
      .sort({ createdAt: -1 });
    reply.send(expenses);
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

// Get expense by ID
const getExpenseById = async (request, reply) => {
  try {
    const expense = await Expense.findById(request.params.id).populate('cardInvoiceId');
    if (!expense) {
      return reply.status(404).send({ error: 'Expense not found' });
    }
    reply.send(expense);
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

// Create new expense
const createExpense = async (request, reply) => {
  try {
    const data = request.body;

    // Check if installment is set
    if (data.installmentTotal && data.installmentTotal > 1) {
      const installmentTotal = parseInt(data.installmentTotal);
      delete data.installmentTotal; // Remove from base data

      const expenses = await createInstallmentExpenses(data, installmentTotal);
      return reply.status(201).send({
        message: `Created ${installmentTotal} installment expenses`,
        expenses,
      });
    }

    // Create single expense
    const expense = new Expense(data);
    await expense.save();
    reply.status(201).send(expense);
  } catch (error) {
    reply.status(400).send({ error: error.message });
  }
};

// Update expense
const updateExpense = async (request, reply) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      request.params.id,
      request.body,
      { new: true, runValidators: true }
    );
    if (!expense) {
      return reply.status(404).send({ error: 'Expense not found' });
    }
    reply.send(expense);
  } catch (error) {
    reply.status(400).send({ error: error.message });
  }
};

// Delete expense
const deleteExpense = async (request, reply) => {
  try {
    const expense = await Expense.findByIdAndDelete(request.params.id);
    if (!expense) {
      return reply.status(404).send({ error: 'Expense not found' });
    }
    reply.send({ message: 'Expense deleted successfully' });
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

// Upload receipt
const uploadReceipt = async (request, reply) => {
  try {
    const data = await request.file();
    
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const buffer = await data.toBuffer();
    const receiptUrl = await uploadToS3(buffer, data.filename, data.mimetype);

    // Update expense with receipt URL
    const expense = await Expense.findByIdAndUpdate(
      request.params.id,
      { receipt: receiptUrl },
      { new: true }
    );

    if (!expense) {
      return reply.status(404).send({ error: 'Expense not found' });
    }

    reply.send({ message: 'Receipt uploaded successfully', expense });
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  uploadReceipt,
};
