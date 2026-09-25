import {
  IsDate,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const toDate = (value: unknown): Date | undefined =>
  value ? new Date(value as string) : undefined;

const CPF_PATTERN = /^\d{11}$/;
const RG_PATTERN = /^[0-9A-Za-z]{5,20}$/;

export class CreateUserDto {
  @ApiProperty({ example: "João" })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "Silva" })
  @IsString()
  @MaxLength(120)
  lastName!: string;

  @ApiProperty({ example: "joao@example.com" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: "11999999999" })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: "12345678901", description: "11 dígitos sem pontuação" })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.replace(/\D/g, "") : value))
  @Matches(CPF_PATTERN, { message: "cpf must contain exactly 11 digits" })
  cpf?: string;

  @ApiPropertyOptional({ example: "1234567", description: "5–20 caracteres alfanuméricos" })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.replace(/[^0-9A-Za-z]/g, "").toUpperCase() : value))
  @Matches(RG_PATTERN, { message: "rg must contain 5 to 20 alphanumeric characters" })
  rg?: string;

  @ApiPropertyOptional({ minimum: 0, example: 5000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salary?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  lastLogin?: Date;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(120)
  lastName?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: "11 dígitos sem pontuação" })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.replace(/\D/g, "") : value))
  @Matches(CPF_PATTERN, { message: "cpf must contain exactly 11 digits" })
  cpf?: string;

  @ApiPropertyOptional({ description: "5–20 caracteres alfanuméricos" })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.replace(/[^0-9A-Za-z]/g, "").toUpperCase() : value))
  @Matches(RG_PATTERN, { message: "rg must contain 5 to 20 alphanumeric characters" })
  rg?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salary?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  lastLogin?: Date;
}
