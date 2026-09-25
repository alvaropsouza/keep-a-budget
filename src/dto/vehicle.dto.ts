import {
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FuelType } from "../generated/prisma/client/client";
import { MAX_DECIMAL_12_2 } from "../utils/validation";

const CURRENT_YEAR = new Date().getFullYear();

const toDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value;
  const date = new Date(value as string);
  return isNaN(date.getTime()) ? undefined : date;
};

export class CreateVehicleDto {
  @ApiProperty({ example: "ABC-1234" })
  @IsString()
  @MaxLength(10)
  plate!: string;

  @ApiProperty({ example: "Toyota" })
  @IsString()
  @MaxLength(60)
  brand!: string;

  @ApiProperty({ example: "Corolla" })
  @IsString()
  @MaxLength(60)
  model!: string;

  @ApiProperty({ example: 2020 })
  @IsInt()
  @Min(1950)
  @Max(CURRENT_YEAR + 1)
  yearManufacture!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(20)
  renavam?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(30)
  chassis?: string;

  @ApiPropertyOptional({ example: 2021 })
  @IsInt()
  @IsOptional()
  @Min(1950)
  @Max(CURRENT_YEAR + 2)
  yearModel?: number;

  @ApiPropertyOptional({ example: "Prata" })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  color?: string;

  @ApiPropertyOptional({ enum: FuelType })
  @IsEnum(FuelType)
  @IsOptional()
  fuel?: FuelType;

  @ApiPropertyOptional({ format: "date", example: "2025-12-31" })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  ipvaExpiry?: Date;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(MAX_DECIMAL_12_2)
  ipvaValue?: number;

  @ApiPropertyOptional({ format: "date", example: "2025-12-31" })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  insuranceExpiry?: Date;

  @ApiPropertyOptional({ format: "date", example: "2025-12-31" })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  licensingExpiry?: Date;

  @ApiPropertyOptional({ minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  currentKm?: number;

  @ApiPropertyOptional({ format: "date", example: "2025-06-01" })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  lastServiceDate?: Date;

  @ApiPropertyOptional({ minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  nextOilChangeKm?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  photoUrl?: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: "ABC-1234" })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  plate?: string;

  @ApiPropertyOptional({ example: "Toyota" })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  brand?: string;

  @ApiPropertyOptional({ example: "Corolla" })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  model?: string;

  @ApiPropertyOptional({ example: 2020 })
  @IsInt()
  @IsOptional()
  @Min(1950)
  @Max(CURRENT_YEAR + 1)
  yearManufacture?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(20)
  renavam?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(30)
  chassis?: string;

  @ApiPropertyOptional({ example: 2021 })
  @IsInt()
  @IsOptional()
  @Min(1950)
  @Max(CURRENT_YEAR + 2)
  yearModel?: number;

  @ApiPropertyOptional({ example: "Prata" })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  color?: string;

  @ApiPropertyOptional({ enum: FuelType })
  @IsEnum(FuelType)
  @IsOptional()
  fuel?: FuelType;

  @ApiPropertyOptional({ format: "date", example: "2025-12-31" })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  ipvaExpiry?: Date;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(MAX_DECIMAL_12_2)
  ipvaValue?: number;

  @ApiPropertyOptional({ format: "date", example: "2025-12-31" })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  insuranceExpiry?: Date;

  @ApiPropertyOptional({ format: "date", example: "2025-12-31" })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  licensingExpiry?: Date;

  @ApiPropertyOptional({ minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  currentKm?: number;

  @ApiPropertyOptional({ format: "date", example: "2025-06-01" })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  lastServiceDate?: Date;

  @ApiPropertyOptional({ minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  nextOilChangeKm?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  photoUrl?: string;
}
