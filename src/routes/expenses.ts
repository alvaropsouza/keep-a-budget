import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  uploadReceipt,
} from "../controllers/expenses/expenses.controller";

async function expenseRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // Get all expenses with optional query filters
  fastify.get("/", getAllExpenses);

  // Get expense by ID
  fastify.get("/:id", getExpenseById);

  // Create new expense
  fastify.post("/", createExpense);

  // Update expense
  fastify.put("/:id", updateExpense);

  // Delete expense
  fastify.delete("/:id", deleteExpense);

  // Upload receipt for expense
  fastify.post("/:id/receipt", uploadReceipt);
}

export default expenseRoutes;
