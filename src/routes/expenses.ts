import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  uploadReceipt,
  deleteReceipt,
} from "../controllers/expense.controller";
import { expenseSchemas } from "../docs/expense.schemas";

async function expenseRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.get(
    "/",
    {
      schema: expenseSchemas.getAllExpenses,
      preHandler: fastify.authenticate,
    },
    getAllExpenses,
  );

  fastify.get(
    "/:id",
    {
      schema: expenseSchemas.getExpenseById,
      preHandler: fastify.authenticate,
    },
    getExpenseById,
  );

  fastify.post(
    "/",
    {
      schema: expenseSchemas.createExpense,
      attachValidation: true,
      preHandler: fastify.authenticate,
    },
    createExpense,
  );

  fastify.put(
    "/:id",
    {
      schema: expenseSchemas.updateExpense,
      preHandler: fastify.authenticate,
    },
    updateExpense,
  );

  fastify.delete(
    "/:id",
    {
      schema: expenseSchemas.deleteExpense,
      preHandler: fastify.authenticate,
    },
    deleteExpense,
  );

  fastify.post(
    "/:id/receipt",
    {
      schema: expenseSchemas.uploadReceipt,
      preHandler: fastify.authenticate,
    },
    uploadReceipt,
  );

  fastify.delete(
    "/:id/receipt",
    {
      schema: expenseSchemas.deleteReceipt,
      preHandler: fastify.authenticate,
    },
    deleteReceipt,
  );
}

export default expenseRoutes;
