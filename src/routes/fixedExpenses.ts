import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  getAllFixedExpenses,
  getFixedExpenseById,
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  getTotalFixedExpenses,
} from "../controllers/fixedExpense.controller";
import { fixedExpenseSchemas } from "../docs/fixedExpense.schemas";

async function fixedExpenseRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.get(
    "/",
    {
      schema: fixedExpenseSchemas.getAllFixedExpenses,
    },
    getAllFixedExpenses,
  );

  fastify.get(
    "/total",
    {
      schema: fixedExpenseSchemas.getTotalFixedExpenses,
    },
    getTotalFixedExpenses,
  );

  fastify.get(
    "/:id",
    {
      schema: fixedExpenseSchemas.getFixedExpenseById,
    },
    getFixedExpenseById,
  );

  fastify.post(
    "/",
    {
      schema: fixedExpenseSchemas.createFixedExpense,
      attachValidation: true,
    },
    createFixedExpense,
  );

  fastify.put(
    "/:id",
    {
      schema: fixedExpenseSchemas.updateFixedExpense,
    },
    updateFixedExpense,
  );

  fastify.delete(
    "/:id",
    {
      schema: fixedExpenseSchemas.deleteFixedExpense,
    },
    deleteFixedExpense,
  );
}

export default fixedExpenseRoutes;
