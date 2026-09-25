import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MAX_DECIMAL_12_2 } from "../utils/validation";

export class CreateExpenseDto {
  @ApiProperty({ example: "Nubank", description: "Nome de uma forma de pagamento cadastrada" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  bank!: string;

  @ApiProperty({ example: "Alimentação" })
  @IsString()
  @MaxLength(120)
  category!: string;

  @ApiProperty({ minimum: 0, example: 59.9 })
  @IsNumber()
  @Min(0)
  @Max(MAX_DECIMAL_12_2)
  amount!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
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
  date?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2048)
  receipt?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  irDeductible?: boolean;
}

export class UpdateExpenseDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(120)
  bank?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(120)
  category?: string;

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

  @ApiPropertyOptional({ format: "uuid" })
  @IsUUID()
  @IsOptional()
  cardInvoiceId?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsDateString()
  @IsOptional()
  date?: string;

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
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(120)
  bank?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(120)
  category?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsUUID()
  @IsOptional()
  cardInvoiceId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(20)
  minAmount?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(20)
  maxAmount?: string;

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
