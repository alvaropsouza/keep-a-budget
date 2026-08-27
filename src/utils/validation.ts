import { validate } from "class-validator";
import { plainToInstance, type ClassConstructor } from "class-transformer";

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
