import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  uploadReceipt,
  deleteReceipt,
} from "../controllers/expenses/expenses.controller";
import { expenseSchemas } from "../docs/expense.schemas";

async function expenseRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.get(
    "/",
    {
      schema: expenseSchemas.getAllExpenses,
    },
    getAllExpenses
  );

  fastify.get(
    "/:id",
    {
      schema: expenseSchemas.getExpenseById,
    },
    getExpenseById
  );

  fastify.post(
    "/",
    {
      schema: expenseSchemas.createExpense,
      attachValidation: true,
    },
    createExpense
  );

  fastify.put(
    "/:id",
    {
      schema: expenseSchemas.updateExpense,
    },
    updateExpense
  );

  fastify.delete(
    "/:id",
    {
      schema: expenseSchemas.deleteExpense,
    },
    deleteExpense
  );

  fastify.post(
    "/:id/receipt",
    {
      schema: expenseSchemas.uploadReceipt,
    },
    uploadReceipt
  );

  fastify.delete(
    "/:id/receipt",
    {
      schema: expenseSchemas.deleteReceipt,
    },
    deleteReceipt
  );
}

export default expenseRoutes;
