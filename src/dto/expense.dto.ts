import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  IsDateString,
  IsEnum,
} from "class-validator";
import { BanksEnum } from "../enums/banks.enum";

export class CreateExpenseDto {
  @IsEnum(BanksEnum)
  bank!: BanksEnum;

  @IsString()
  category!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  installmentTotal?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  installmentStartNumber?: number;

  @IsDateString()
  @IsOptional()
  installmentStartDate?: string;

  @IsString()
  @IsOptional()
  receipt?: string;
}

export class UpdateExpenseDto {
  @IsEnum(BanksEnum)
  @IsOptional()
  bank?: BanksEnum;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  cardInvoiceId?: string;
}

export class ExpenseQueryParamsDto {
  @IsEnum(BanksEnum)
  @IsOptional()
  bank?: BanksEnum;

  @IsString()
  @IsOptional()
  category?: string;

  @IsUUID()
  @IsOptional()
  cardInvoiceId?: string;

  @IsString()
  @IsOptional()
  minAmount?: string;

  @IsString()
  @IsOptional()
  maxAmount?: string;

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
