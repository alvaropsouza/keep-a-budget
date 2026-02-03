import { FastifyReply } from "fastify";
import { validateAndRespond } from "../utils/validation";

export abstract class BaseController {
  protected async validate(
    dtoClass: any,
    data: any,
    reply: FastifyReply,
  ): Promise<boolean> {
    return validateAndRespond(dtoClass, data, reply);
  }

  protected handleError(error: any, reply: FastifyReply): void {
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
}
