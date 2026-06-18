import { validate } from "class-validator";
import { plainToInstance, type ClassConstructor } from "class-transformer";
import { FastifyReply } from "fastify";
import logger from "../config/logger";

export async function validateDto(
  dtoClass: ClassConstructor<object>,
  data: unknown
): Promise<{ valid: boolean; errors?: Record<string, string[]> }> {
  const dto = plainToInstance(dtoClass, data);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    const errorMap: Record<string, string[]> = {};
    errors.forEach((error) => {
      if (error.property) {
        errorMap[error.property] = Object.values(error.constraints || {});
      }
    });
    return { valid: false, errors: errorMap };
  }

  return { valid: true };
}

export function createValidationErrorResponse(
  errors: Record<string, string[]>
): Record<string, unknown> {
  return {
    statusCode: 400,
    error: "Validation Error",
    message: "Invalid request body",
    details: errors,
  };
}

export async function validateAndRespond(
  dtoClass: ClassConstructor<object>,
  data: unknown,
  reply: FastifyReply
): Promise<boolean> {
  const { valid, errors } = await validateDto(dtoClass, data);

  if (!valid) {
    logger.warn({ errors }, "Validation failed");
    reply.status(400).send(createValidationErrorResponse(errors || {}));
    return false;
  }

  return true;
}
