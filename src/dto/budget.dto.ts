import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MAX_DECIMAL_12_2 } from "../utils/validation";

export class UpsertBudgetDto {
  @ApiProperty({ example: "Alimentação" })
  @IsString()
  @MaxLength(120)
  category!: string;

  @ApiProperty({ minimum: 0, example: 800 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(MAX_DECIMAL_12_2)
  amount!: number;

  @ApiProperty({ minimum: 1, maximum: 12, example: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({ minimum: 2020, example: 2025 })
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  year!: number;

  @ApiProperty({ type: [String], format: "uuid" })
  @IsArray()
  @IsUUID("4", { each: true })
  invoiceIds!: string[];
}

export class BudgetQueryDto {
  @ApiProperty({ minimum: 1, maximum: 12, example: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({ minimum: 2020, example: 2025 })
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  year!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  invoiceIds?: string;
}
