import { IsString, IsNumber, IsOptional, IsDateString, Min, IsNumberString } from "class-validator";

export class CreateIrDocumentDto {
  @IsDateString()
  date!: string;

  @IsString()
  category!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class IrDocumentQueryDto {
  @IsNumberString()
  year!: string;
}
