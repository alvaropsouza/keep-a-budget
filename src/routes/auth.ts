import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  login,
  authenticate,
  validateSession,
  me,
  logout,
} from "../controllers/auth.controller";
import { authSchemas } from "../docs/auth.schemas";

async function authRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.post(
    "/login",
    {
      schema: authSchemas.login,
    },
    login,
  );

  fastify.post(
    "/authenticate",
    {
      schema: authSchemas.authenticate,
    },
    authenticate,
  );

  fastify.get(
    "/validate",
    {
      schema: authSchemas.validate,
    },
    validateSession,
  );

  fastify.get(
    "/me",
    {
      schema: authSchemas.me,
    },
    me,
  );

  fastify.post(
    "/logout",
    {
      schema: authSchemas.logout,
    },
    logout,
  );
}

export default authRoutes;
