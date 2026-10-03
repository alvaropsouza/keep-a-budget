import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FuelType } from "../generated/prisma/client/client";

const CURRENT_YEAR = new Date().getFullYear();


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





  @ApiPropertyOptional({ minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  currentKm?: number;



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





  @ApiPropertyOptional({ minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  currentKm?: number;



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
