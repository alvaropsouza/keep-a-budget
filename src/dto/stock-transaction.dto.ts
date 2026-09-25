import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { StockTransactionType, StockOperationType } from "../interfaces/stock-transaction";
import { MAX_DECIMAL_12_2, MAX_DECIMAL_12_4, MAX_DECIMAL_18_6 } from "../utils/validation";

const TRANSACTION_TYPES: StockTransactionType[] = ["COMPRA", "VENDA"];
const OPERATION_TYPES: StockOperationType[] = ["NORMAL", "DAY_TRADE"];

export class CreateStockTransactionDto {
  @ApiProperty({ example: "PETR4" })
  @IsString()
  @MaxLength(12)
  ticker!: string;

  @ApiProperty({ example: "Petróleo Brasileiro SA" })
  @IsString()
  @MaxLength(200)
  companyName!: string;

  @ApiPropertyOptional({ example: "33.000.167/0001-01" })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  cnpj?: string;

  @ApiProperty({ example: "XP Investimentos" })
  @IsString()
  @MaxLength(120)
  broker!: string;

  @ApiProperty({ format: "date", example: "2025-03-15" })
  @IsDateString()
  date!: string;

  @ApiProperty({ enum: TRANSACTION_TYPES })
  @IsIn(TRANSACTION_TYPES)
  type!: StockTransactionType;

  @ApiProperty({ enum: OPERATION_TYPES })
  @IsIn(OPERATION_TYPES)
  operationType!: StockOperationType;

  @ApiProperty({ minimum: 0, example: 100 })
  @IsNumber()
  @Min(0)
  @Max(MAX_DECIMAL_18_6)
  quantity!: number;

  @ApiProperty({ minimum: 0, example: 32.5 })
  @IsNumber()
  @Min(0)
  @Max(MAX_DECIMAL_12_4)
  unitPrice!: number;

  @ApiProperty({ minimum: 0, example: 4.9 })
  @IsNumber()
  @Min(0)
  @Max(MAX_DECIMAL_12_2)
  fees!: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isOpeningBalance?: boolean;
}

export class StockTransactionQueryDto {
  @ApiProperty({ example: "2025" })
  @IsNumberString()
  year!: string;
}
