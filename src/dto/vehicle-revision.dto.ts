import {
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
import { MAX_DECIMAL_12_2 } from "../utils/validation";

const toOptionalNumber = ({ value }: { value: unknown }) =>
  value !== undefined && value !== null && value !== "" ? Number(value) : undefined;

export class CreateVehicleRevisionDto {
  @ApiProperty({ example: "2024-03-15" })
  @IsString()
  @MaxLength(30)
  date!: string;

  @ApiPropertyOptional({ example: 45000 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  km?: number;

  @ApiPropertyOptional({ example: "Troca de óleo e filtros" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 650.9 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_DECIMAL_12_2)
  cost?: number;
}

export class UpdateVehicleRevisionDto extends CreateVehicleRevisionDto {}
