import { IsString, IsDateString, IsOptional, IsEnum } from "class-validator";
import { BanksEnum } from "../../../enums/banks.enum";

export class CreateInvoiceDto {
  @IsDateString()
  invoiceDate!: string;

  @IsString()
  @IsEnum(BanksEnum)
  bank!: string;
}

export class UpdateInvoiceDto {
  @IsDateString()
  @IsOptional()
  invoiceDate?: string;

  @IsString()
  @IsOptional()
  @IsEnum(BanksEnum)
  bank?: string;
}

export class InvoiceQueryParamsDto {
  @IsString()
  @IsOptional()
  bank?: string;

  @IsDateString()
  @IsOptional()
  invoiceDate?: string;

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
