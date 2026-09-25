import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MAX_DECIMAL_12_2 } from "../utils/validation";

export class CreateExtraIncomeDto {
  @ApiProperty({ example: "Freela de site" })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description!: string;

  @ApiProperty({ minimum: 0.01, example: 1500 })
  @IsNumber()
  @Min(0.01)
  @Max(MAX_DECIMAL_12_2)
  amount!: number;

  @ApiProperty({ example: "2026-07-08" })
  @IsDateString()
  date!: string;
}

export class ExtraIncomeQueryParamsDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 12, example: 7 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ minimum: 2020, example: 2026 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(2020)
  year?: number;
}
