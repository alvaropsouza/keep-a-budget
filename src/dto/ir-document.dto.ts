import {
  IsDateString,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MAX_DECIMAL_12_2 } from "../utils/validation";

export class CreateIrDocumentDto {
  @ApiProperty({ format: "date", example: "2025-03-15" })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: "Médico" })
  @IsString()
  @MaxLength(120)
  category!: string;

  @ApiProperty({ minimum: 0, example: 350 })
  @IsNumber()
  @Min(0)
  @Max(MAX_DECIMAL_12_2)
  amount!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

export class IrDocumentQueryDto {
  @ApiProperty({ example: "2025" })
  @IsNumberString()
  year!: string;
}
