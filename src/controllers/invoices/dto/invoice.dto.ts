import {
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
} from "class-validator";
import { BanksEnum } from "../../../enums/banks.enum";

export class CreateInvoiceDto {
  @IsString()
  @IsEnum(BanksEnum)
  bank!: string;

  @IsDateString()
  openDate!: string;

  @IsDateString()
  closingDate!: string;

  @IsDateString()
  dueDate!: string;

  @IsNumber()
  @IsOptional()
  amount?: number;
}

export class UpdateInvoiceDto {
  @IsString()
  @IsOptional()
  @IsEnum(BanksEnum)
  bank?: string;

  @IsDateString()
  @IsOptional()
  openDate?: string;

  @IsDateString()
  @IsOptional()
  closingDate?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;
}

export class InvoiceQueryParamsDto {
  @IsString()
  @IsOptional()
  bank?: string;

  @IsDateString()
  @IsOptional()
  openDate?: string;

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
