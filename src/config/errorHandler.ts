import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../utils/AppError";
import mongoose from "mongoose";

export const errorHandler = (
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: error.message,
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

  // Mongo duplicate key error (e.g., unique index violation)
  const mongoError = error as mongoose.mongo.MongoServerError;
  if (mongoError?.code === 11000) {
    return reply.status(409).send({
      error: "Invoice already exists for this bank and period",
      details: mongoError.keyValue,
    });
  }

  // Log unknown errors
  request.log.error(error);

  return reply.status(500).send({
    error: "Internal Server Error",
  });
};
