import {
  IsDate,
  IsDateString,
  IsOptional,
  IsNumber,
  IsString,
  Min,
  MinLength,
  IsBoolean,
} from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const toDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value;
  const date = new Date(value as string);
  return isNaN(date.getTime()) ? undefined : date;
};

export class CreateInvoiceDto {
  @ApiProperty({ example: "Nubank", description: "Nome de um cartão cadastrado" })
  @IsString()
  @MinLength(1)
  bank!: string;

  @ApiProperty({ format: "date-time" })
  @IsDate()
  @Transform(({ value }) => toDate(value))
  closingDate!: Date;

  @ApiProperty({ format: "date-time" })
  @IsDate()
  @Transform(({ value }) => toDate(value))
  dueDate!: Date;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  balance?: number;
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bank?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  closingDate?: Date;

  @ApiPropertyOptional({ format: "date-time" })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  dueDate?: Date;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  balance?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isClosed?: boolean;
}

export class InvoiceQueryParamsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bank?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsDateString()
  @IsOptional()
  closingDate?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsDateString()
  @IsOptional()
  createdStartDate?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsDateString()
  @IsOptional()
  createdEndDate?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsDateString()
  @IsOptional()
  updatedStartDate?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsDateString()
  @IsOptional()
  updatedEndDate?: string;
}

export class AdvanceInvoiceDto {
  @ApiProperty({ minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount!: number;
}

export class CloseInvoiceDto {
  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  balance?: number;
}
