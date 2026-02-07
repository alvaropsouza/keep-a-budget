import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from "class-validator";

export class CreateFixedExpenseDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateFixedExpenseDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class FixedExpenseQueryParamsDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
