import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";
import { userSchemas } from "../docs/user.schemas";

async function userRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.get(
    "/",
    {
      schema: userSchemas.getAllUsers,
      preHandler: fastify.authenticate,
    },
    getAllUsers,
  );

  fastify.get(
    "/by-email/:email",
    {
      schema: userSchemas.getUserByEmail,
      preHandler: fastify.authenticate,
    },
    getUserByEmail,
  );

  fastify.get(
    "/:id",
    {
      schema: userSchemas.getUserById,
      preHandler: fastify.authenticate,
    },
    getUserById,
  );

  fastify.post(
    "/",
    {
      schema: userSchemas.createUser,
    },
    createUser,
  );

  fastify.put(
    "/:id",
    {
      schema: userSchemas.updateUser,
      preHandler: fastify.authenticate,
    },
    updateUser,
  );

  fastify.delete(
    "/:id",
    {
      schema: userSchemas.deleteUser,
      preHandler: fastify.authenticate,
    },
    deleteUser,
  );
}

export default userRoutes;
