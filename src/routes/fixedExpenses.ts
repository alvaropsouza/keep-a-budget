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
      preHandler: fastify.authenticate,
    },
    getAllFixedExpenses,
  );

  fastify.get(
    "/total",
    {
      schema: fixedExpenseSchemas.getTotalFixedExpenses,
      preHandler: fastify.authenticate,
    },
    getTotalFixedExpenses,
  );

  fastify.get(
    "/:id",
    {
      schema: fixedExpenseSchemas.getFixedExpenseById,
      preHandler: fastify.authenticate,
    },
    getFixedExpenseById,
  );

  fastify.post(
    "/",
    {
      schema: fixedExpenseSchemas.createFixedExpense,
      attachValidation: true,
      preHandler: fastify.authenticate,
    },
    createFixedExpense,
  );

  fastify.put(
    "/:id",
    {
      schema: fixedExpenseSchemas.updateFixedExpense,
      preHandler: fastify.authenticate,
    },
    updateFixedExpense,
  );

  fastify.delete(
    "/:id",
    {
      schema: fixedExpenseSchemas.deleteFixedExpense,
      preHandler: fastify.authenticate,
    },
    deleteFixedExpense,
  );
}

export default fixedExpenseRoutes;
