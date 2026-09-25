import { validate } from "class-validator";
import { plainToInstance, type ClassConstructor } from "class-transformer";

export const MAX_DECIMAL_12_2 = 9_999_999_999.99;
export const MAX_DECIMAL_12_4 = 99_999_999.9999;
export const MAX_DECIMAL_18_6 = 999_999_999_999.999999;

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
