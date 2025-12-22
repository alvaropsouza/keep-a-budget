const {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  uploadReceipt,
} = require('../controllers/expenseController');

async function expenseRoutes(fastify, options) {
  // Get all expenses with optional query filters
  fastify.get('/', getAllExpenses);

  // Get expense by ID
  fastify.get('/:id', getExpenseById);

  // Create new expense
  fastify.post('/', createExpense);

  // Update expense
  fastify.put('/:id', updateExpense);

  // Delete expense
  fastify.delete('/:id', deleteExpense);

  // Upload receipt for expense
  fastify.post('/:id/receipt', uploadReceipt);
}

module.exports = expenseRoutes;
