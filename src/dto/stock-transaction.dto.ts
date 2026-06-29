import { IsString, IsNumber, IsOptional, IsDateString, IsIn, IsNumberString, IsBoolean, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { StockTransactionType, StockOperationType } from "../interfaces/stock-transaction";

const TRANSACTION_TYPES: StockTransactionType[] = ["COMPRA", "VENDA"];
const OPERATION_TYPES: StockOperationType[] = ["NORMAL", "DAY_TRADE"];

export class CreateStockTransactionDto {
  @ApiProperty({ example: "PETR4" })
  @IsString()
  ticker!: string;

  @ApiProperty({ example: "Petróleo Brasileiro SA" })
  @IsString()
  companyName!: string;

  @ApiPropertyOptional({ example: "33.000.167/0001-01" })
  @IsString()
  @IsOptional()
  cnpj?: string;

  @ApiProperty({ example: "XP Investimentos" })
  @IsString()
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
  quantity!: number;

  @ApiProperty({ minimum: 0, example: 32.5 })
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiProperty({ minimum: 0, example: 4.9 })
  @IsNumber()
  @Min(0)
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
