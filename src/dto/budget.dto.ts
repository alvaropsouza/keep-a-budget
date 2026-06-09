import { IsString, IsNumber, IsInt, IsOptional, Min, Max } from "class-validator";

export class UpsertBudgetDto {
  @IsString()
  category!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsInt()
  @Min(2020)
  year!: number;
}

export class BudgetQueryDto {
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsInt()
  @Min(2020)
  year!: number;

  @IsString()
  @IsOptional()
  invoiceIds?: string;
}
