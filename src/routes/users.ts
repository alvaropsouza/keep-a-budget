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
    },
    getAllUsers,
  );

  fastify.get(
    "/by-email/:email",
    {
      schema: userSchemas.getUserByEmail,
    },
    getUserByEmail,
  );

  fastify.get(
    "/:id",
    {
      schema: userSchemas.getUserById,
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
    },
    updateUser,
  );

  fastify.delete(
    "/:id",
    {
      schema: userSchemas.deleteUser,
    },
    deleteUser,
  );
}

export default userRoutes;
