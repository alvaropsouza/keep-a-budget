import "fastify";
import { AuthUser } from "../services/auth.service";

declare module "fastify" {
  interface FastifyRequest {
    authUser: AuthUser | null;
  }

  interface FastifyInstance {
    authenticate(request: FastifyRequest): Promise<void>;
  }
}
