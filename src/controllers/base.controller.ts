import { FastifyReply } from "fastify";
import { validateAndRespond } from "../utils/validation";
import { AppError } from "../utils/AppError";
import { AuthUser } from "../services/auth.service";

export abstract class BaseController {
  protected async validate(
    dtoClass: any,
    data: any,
    reply: FastifyReply,
  ): Promise<boolean> {
    return validateAndRespond(dtoClass, data, reply);
  }

  protected handleError(error: any, reply: FastifyReply): void {
    reply.request.log.error(
      {
        error,
        reqId: reply.request.id,
        method: reply.request.method,
        url: reply.request.url,
        params: reply.request.params,
        query: reply.request.query,
      },
      "Controller request failed",
    );

    if (error.name === "DocumentNotFoundError") {
      reply.status(404).send({ error: "Resource not found" });
      return;
    }

    if (error.statusCode) {
      reply.status(error.statusCode).send({
        error: error.message,
        ...(error.details && { details: error.details }),
      });
      return;
    }

    reply.status(500).send({ error: "Internal server error" });
  }

  protected requireAuthUser(authUser: AuthUser | null | undefined): AuthUser {
    if (!authUser) {
      throw new AppError("Unauthorized", 401);
    }

    return authUser;
  }
}
