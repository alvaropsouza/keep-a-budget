import { ExceptionFilter, Catch, ArgumentsHost, Logger, HttpException } from "@nestjs/common";
import { FastifyReply } from "fastify";
import { AppError } from "../utils/AppError";

@Catch()
export class AppErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    if (exception instanceof AppError) {
      reply.status(exception.statusCode).send({
        error: exception.message,
        ...(exception.details && { details: exception.details }),
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      reply.status(status).send(
        typeof response === "string" ? { error: response } : response,
      );
      return;
    }

    this.logger.error(exception, "Unhandled exception");
    reply.status(500).send({ error: "Internal server error" });
  }
}
