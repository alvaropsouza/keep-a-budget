import {
  IsDate,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsBoolean,
} from "class-validator";
import { Transform } from "class-transformer";
import { BanksEnum } from "../enums/banks.enum";

const toDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value;
  const date = new Date(value as string);
  return isNaN(date.getTime()) ? undefined : date;
};

export class CreateInvoiceDto {
  @IsEnum(BanksEnum)
  bank!: BanksEnum;

  @IsDate()
  @Transform(({ value }) => toDate(value))
  closingDate!: Date;

  @IsDate()
  @Transform(({ value }) => toDate(value))
  dueDate!: Date;

  @IsNumber()
  @IsOptional()
  @Min(0)
  balance?: number;
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsEnum(BanksEnum)
  bank?: BanksEnum;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  closingDate?: Date;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  dueDate?: Date;

  @IsNumber()
  @IsOptional()
  @Min(0)
  balance?: number;

  @IsBoolean()
  @IsOptional()
  isClosed?: boolean;
}

export class InvoiceQueryParamsDto {
  @IsOptional()
  @IsEnum(BanksEnum)
  bank?: BanksEnum;

  @IsDateString()
  @IsOptional()
  closingDate?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsDateString()
  @IsOptional()
  createdStartDate?: string;

  @IsDateString()
  @IsOptional()
  createdEndDate?: string;

  @IsDateString()
  @IsOptional()
  updatedStartDate?: string;

  @IsDateString()
  @IsOptional()
  updatedEndDate?: string;
}

export class AdvanceInvoiceDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;
}

export class CloseInvoiceDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  balance?: number;
}
