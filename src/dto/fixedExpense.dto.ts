import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from "class-validator";
import { Transform } from "class-transformer";

const toOptionalBoolean = ({ value }: { value: unknown }): boolean | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  return undefined;
};

export class CreateFixedExpenseDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateFixedExpenseDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class FixedExpenseQueryParamsDto {
  @Transform(toOptionalBoolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
