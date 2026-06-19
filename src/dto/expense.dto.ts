import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsNumberString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BanksEnum } from "../enums/banks.enum";

export class CreateExpenseDto {
  @ApiProperty({ enum: BanksEnum })
  @IsEnum(BanksEnum)
  bank!: BanksEnum;

  @ApiProperty({ example: "Alimentação" })
  @IsString()
  category!: string;

  @ApiProperty({ minimum: 0, example: 59.9 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ minimum: 1, example: 12 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  installmentTotal?: number;

  @ApiPropertyOptional({ minimum: 1, example: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  installmentStartNumber?: number;

  @ApiPropertyOptional({ format: "date-time" })
  @IsDateString()
  @IsOptional()
  installmentStartDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  receipt?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  irDeductible?: boolean;
}

export class UpdateExpenseDto {
  @ApiPropertyOptional({ enum: BanksEnum })
  @IsEnum(BanksEnum)
  @IsOptional()
  bank?: BanksEnum;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsUUID()
  @IsOptional()
  cardInvoiceId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  irDeductible?: boolean;
}

export class IrQueryParamsDto {
  @ApiProperty({ example: "2025" })
  @IsNumberString()
  year!: string;
}

export class IrToggleDto {
  @ApiProperty()
  @IsBoolean()
  irDeductible!: boolean;
}

export class ExpenseQueryParamsDto {
  @ApiPropertyOptional({ enum: BanksEnum })
  @IsEnum(BanksEnum)
  @IsOptional()
  bank?: BanksEnum;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsUUID()
  @IsOptional()
  cardInvoiceId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  minAmount?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  maxAmount?: string;

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
