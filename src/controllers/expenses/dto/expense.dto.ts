import {
  IsString,
  IsNumber,
  IsOptional,
  IsMongoId,
  Min,
  IsDateString,
  IsEnum,
} from "class-validator";
import { BanksEnum } from "../../../enums/banks.enum";

export class CreateExpenseDto {
  @IsEnum(BanksEnum)
  bank!: string;

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

  @IsDateString()
  @IsOptional()
  installmentStartDate?: string;
}

export class UpdateExpenseDto {
  @IsEnum(BanksEnum)
  @IsOptional()
  bank?: string;

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

  @IsMongoId()
  @IsOptional()
  cardInvoiceId?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  installmentTotal?: number;

  @IsDateString()
  @IsOptional()
  installmentStartDate?: string;
}

export class ExpenseQueryParamsDto {
  @IsEnum(BanksEnum)
  @IsOptional()
  bank?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsMongoId()
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
