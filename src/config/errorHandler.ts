import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../utils/AppError";
import mongoose from "mongoose";

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

  if (error instanceof mongoose.Error.DocumentNotFoundError) {
    return reply.status(404).send({
      error: "Resource not found",
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return reply.status(400).send({
      error: `Invalid ${error.path}: ${error.value}`,
    });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map((el) => el.message);
    return reply.status(400).send({
      error: `Invalid input data. ${errors.join(". ")}`,
    });
  }

  const mongoError = error as mongoose.mongo.MongoServerError;
  if (mongoError?.code === 11000) {
    const duplicateFields = mongoError.keyValue || {};
    const message = duplicateFields.email
      ? "User already exists with this email"
      : "Duplicate key error";
    return reply.status(409).send({
      error: message,
      details: duplicateFields,
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
