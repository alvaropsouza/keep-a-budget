import { IsString, IsNumber, IsOptional, IsEnum, IsDate, IsInt, Min, Max } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FuelType } from "../generated/prisma/client/client";

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
  plate!: string;

  @ApiProperty({ example: "Toyota" })
  @IsString()
  brand!: string;

  @ApiProperty({ example: "Corolla" })
  @IsString()
  model!: string;

  @ApiProperty({ example: 2020 })
  @IsInt()
  @Min(1950)
  @Max(CURRENT_YEAR + 1)
  yearManufacture!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  renavam?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
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
  plate?: string;

  @ApiPropertyOptional({ example: "Toyota" })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ example: "Corolla" })
  @IsString()
  @IsOptional()
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
  renavam?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
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
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  photoUrl?: string;
}
