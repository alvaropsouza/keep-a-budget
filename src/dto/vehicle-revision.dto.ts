import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateVehicleRevisionDto {
  @ApiProperty({ example: "2024-03-15" })
  @IsString()
  @MaxLength(30)
  date!: string;

  @ApiPropertyOptional({ example: 45000 })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (value !== undefined && value !== "" ? Number(value) : undefined))
  @IsInt()
  @Min(0)
  km?: number;

  @ApiPropertyOptional({ example: "Troca de óleo e filtros" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
