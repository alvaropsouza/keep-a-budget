import {
  IsString,
  IsOptional,
  IsEmail,
  IsISO8601,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateFreelanceInvoiceItemDto {
  @IsString()
  description!: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsNumber()
  @Min(0.01)
  unitPrice!: number;
}

export class UpdateFreelanceInvoiceItemDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  unitPrice?: number;
}

export class CreateFreelanceInvoiceDto {
  @IsString()
  clientName!: string;

  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @IsISO8601()
  issueDate!: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFreelanceInvoiceItemDto)
  items!: CreateFreelanceInvoiceItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFreelanceInvoiceDto {
  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @IsOptional()
  @IsISO8601()
  issueDate?: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsOptional()
  @IsEnum(["draft", "sent", "paid"])
  status?: "draft" | "sent" | "paid";

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFreelanceInvoiceItemDto)
  items?: UpdateFreelanceInvoiceItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
