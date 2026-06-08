import { IsString, MinLength, MaxLength } from "class-validator";

export class ParseExpenseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;
}

export interface ParsedExpenseResponse {
  bank: "NUBANK" | "XP" | null;
  amount: number | null;
  date: string | null;
  category: string | null;
  description: string | null;
  installmentTotal: number | null;
}
