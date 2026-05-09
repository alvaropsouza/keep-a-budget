import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../utils/AppError";

type PgError = {
  code?: string;
  detail?: string;
  constraint?: string;
};

export const errorHandler = (
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  request.log.error(
    {
      error,
      reqId: request.id,
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : request.body,
    },
    "Unhandled request error",
  );

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: error.message,
      ...(error.details && { details: error.details }),
    });
  }

  if ((error as Error).name === "DocumentNotFoundError") {
    return reply.status(404).send({
      error: "Resource not found",
    });
  }

  const pgError = error as PgError;

  if (pgError?.code === "22P02") {
    return reply.status(400).send({
      error: "Invalid identifier format",
    });
  }

  if (pgError?.code === "23514") {
    return reply.status(400).send({
      error: "Invalid input data",
      details: pgError.detail,
    });
  }

  if (pgError?.code === "23505") {
    const message = pgError.constraint?.includes("email")
      ? "User already exists with this email"
      : "Duplicate key error";
    return reply.status(409).send({
      error: message,
      details: pgError.detail,
    });
  }

  // Handle Fastify errors (like file too large)
  if ((error as FastifyError).statusCode) {
    return reply.status((error as FastifyError).statusCode!).send({
      error: error.message,
    });
  }

  return reply.status(500).send({
    error: "Internal Server Error",
  });
};
