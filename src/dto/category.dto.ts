import { IsString, IsOptional, MaxLength, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCategoryDto {
  @ApiProperty({ example: "Alimentação", maxLength: 40 })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name!: string;

  @ApiProperty({ example: "🍔", maxLength: 40 })
  @IsString()
  @MaxLength(40)
  icon!: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ maxLength: 40 })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(40)
  name?: string;

  @ApiPropertyOptional({ maxLength: 40 })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  icon?: string;
}
