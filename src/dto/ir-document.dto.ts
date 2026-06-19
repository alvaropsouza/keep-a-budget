import { IsString, IsNumber, IsOptional, IsDateString, Min, IsNumberString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateIrDocumentDto {
  @ApiProperty({ format: "date", example: "2025-03-15" })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: "Médico" })
  @IsString()
  category!: string;

  @ApiProperty({ minimum: 0, example: 350 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class IrDocumentQueryDto {
  @ApiProperty({ example: "2025" })
  @IsNumberString()
  year!: string;
}
