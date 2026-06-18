import { IsString, IsOptional, MaxLength, MinLength } from "class-validator";

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name!: string;

  @IsString()
  @MaxLength(40)
  icon!: string;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(40)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  icon?: string;
}
