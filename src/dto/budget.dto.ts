import { IsString, IsNumber, IsInt, IsOptional, IsArray, IsUUID, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class UpsertBudgetDto {
  @IsString()
  category!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  year!: number;

  @IsArray()
  @IsUUID("4", { each: true })
  invoiceIds!: string[];
}

export class BudgetQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  year!: number;

  @IsString()
  @IsOptional()
  invoiceIds?: string;
}
