import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MAX_DECIMAL_12_2 } from "../utils/validation";

export const RECURRENCE_MONTH_OPTIONS = [1, 2, 3, 6, 12] as const;

const toOptionalDate = ({ value }: { value: unknown }): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (value instanceof Date) return value;
  if (typeof value !== "string") return undefined;

  const parsed = new Date(`${value.split("T")[0]}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

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
  @ApiProperty({ example: "Academia" })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ minimum: 0, example: 99.9 })
  @IsNumber()
  @Min(0)
  @Max(MAX_DECIMAL_12_2)
  amount!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: "Contas" })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  category?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 31, example: 10 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @ApiPropertyOptional({ enum: RECURRENCE_MONTH_OPTIONS, default: 1 })
  @IsNumber()
  @IsOptional()
  @IsIn([...RECURRENCE_MONTH_OPTIONS])
  recurrenceMonths?: number;

  @ApiPropertyOptional({ format: "date", example: "2026-09-01" })
  @Transform(toOptionalDate)
  @IsDate()
  @IsOptional()
  startDate?: Date | null;

  @ApiPropertyOptional({ format: "date", example: "2027-09-01" })
  @Transform(toOptionalDate)
  @IsDate()
  @IsOptional()
  endDate?: Date | null;

  @ApiPropertyOptional({ example: "Nubank" })
  @IsString()
  @IsOptional()
  paymentMethodName?: string | null;

  @ApiPropertyOptional({ default: false })
  @Transform(toOptionalBoolean)
  @IsBoolean()
  @IsOptional()
  autoLaunch?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateFixedExpenseDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(MAX_DECIMAL_12_2)
  amount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(120)
  category?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 31 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @ApiPropertyOptional({ enum: RECURRENCE_MONTH_OPTIONS, default: 1 })
  @IsNumber()
  @IsOptional()
  @IsIn([...RECURRENCE_MONTH_OPTIONS])
  recurrenceMonths?: number;

  @ApiPropertyOptional({ format: "date", example: "2026-09-01" })
  @Transform(toOptionalDate)
  @IsDate()
  @IsOptional()
  startDate?: Date | null;

  @ApiPropertyOptional({ format: "date", example: "2027-09-01" })
  @Transform(toOptionalDate)
  @IsDate()
  @IsOptional()
  endDate?: Date | null;

  @ApiPropertyOptional({ example: "Nubank" })
  @IsString()
  @IsOptional()
  paymentMethodName?: string | null;

  @ApiPropertyOptional({ default: false })
  @Transform(toOptionalBoolean)
  @IsBoolean()
  @IsOptional()
  autoLaunch?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class FixedExpenseQueryParamsDto {
  @ApiPropertyOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class LinkFixedExpensesDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  cardInvoiceId!: string;

  @ApiProperty({ type: [String], format: "uuid" })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID("4", { each: true })
  fixedExpenseIds!: string[];
}

export class LaunchableFixedExpensesQueryDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  cardInvoiceId!: string;
}
