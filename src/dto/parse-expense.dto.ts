import { IsString, MinLength, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ParseExpenseDto {
  @ApiProperty({ example: "Nubank 59,90 ontem alimentação", maxLength: 500 })
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
