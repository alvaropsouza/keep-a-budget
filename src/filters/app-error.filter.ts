import { ExceptionFilter, Catch, ArgumentsHost, Logger, HttpException } from "@nestjs/common";
import { FastifyReply } from "fastify";
import { AppError } from "../utils/AppError";

type DbError = {
  code?: string;
  constraint?: string;
  name?: string;
};

@Catch()
export class AppErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    if (exception instanceof AppError) {
      // 5xx means a systemic failure — log the detail, never expose it.
      if (exception.statusCode >= 500) {
        this.logger.error(
          { statusCode: exception.statusCode, details: exception.details },
          `AppError (server): ${exception.message}`,
        );
        reply.status(exception.statusCode).send({ error: "Internal server error" });
        return;
      }

      this.logger.warn(
        { statusCode: exception.statusCode, details: exception.details },
        `AppError: ${exception.message}`,
      );
      const payload: { error: string; details?: unknown } = { error: exception.message };
      if (exception.details) payload.details = exception.details;
      reply.status(exception.statusCode).send(payload);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      // Only client errors (4xx) are safe to relay; 5xx may carry internals.
      if (status >= 500) {
        this.logger.error({ status, response }, `HttpException (server): ${exception.message}`);
        reply.status(status).send({ error: "Internal server error" });
        return;
      }

      this.logger.warn({ status, response }, `HttpException: ${exception.message}`);
      reply.status(status).send(
        typeof response === "string" ? { error: response } : response,
      );
      return;
    }

    // Known DB / Postgres errors mapped to safe client responses.
    // The raw error detail (column names, conflicting values) is logged
    // server-side only and never relayed to the client.
    const dbError = exception as DbError;

    if (dbError?.name === "DocumentNotFoundError") {
      reply.status(404).send({ error: "Resource not found" });
      return;
    }

    if (dbError?.code === "22P02") {
      this.logger.warn({ code: dbError.code }, "Invalid identifier format");
      reply.status(400).send({ error: "Invalid identifier format" });
      return;
    }

    if (dbError?.code === "23514") {
      this.logger.warn({ code: dbError.code }, "Check constraint violation");
      reply.status(400).send({ error: "Invalid input data" });
      return;
    }

    if (dbError?.code === "23505") {
      this.logger.warn(
        { code: dbError.code, constraint: dbError.constraint },
        "Unique constraint violation",
      );
      const message = dbError.constraint?.includes("email")
        ? "User already exists with this email"
        : "Duplicate key error";
      reply.status(409).send({ error: message });
      return;
    }

    this.logger.error(exception, "Unhandled exception");
    reply.status(500).send({ error: "Internal server error" });
  }
}
