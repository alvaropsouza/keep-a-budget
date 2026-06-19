import "fastify";
import type { AuthUser } from "../interfaces/auth";

declare module "fastify" {
  interface FastifyRequest {
    authUser: AuthUser | null;
  }

  interface FastifyInstance {
    authenticate(request: FastifyRequest): Promise<void>;
  }
}
