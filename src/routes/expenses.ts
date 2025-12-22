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
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.get("/", getAllExpenses);
  fastify.get("/:id", getExpenseById);
  fastify.post("/", createExpense);
  fastify.put("/:id", updateExpense);
  fastify.delete("/:id", deleteExpense);
  fastify.post("/:id/receipt", uploadReceipt);
}

export default expenseRoutes;
