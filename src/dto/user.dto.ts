import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  Min,
  IsDate,
  Matches,
} from "class-validator";
import { Transform } from "class-transformer";

const toDate = (value: unknown): Date | undefined =>
  value ? new Date(value as string) : undefined;

const CPF_PATTERN = /^\d{11}$/;
const RG_PATTERN = /^[0-9A-Za-z]{5,20}$/;

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.replace(/\D/g, "") : value))
  @Matches(CPF_PATTERN, { message: "cpf must contain exactly 11 digits" })
  cpf?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.replace(/[^0-9A-Za-z]/g, "").toUpperCase() : value))
  @Matches(RG_PATTERN, { message: "rg must contain 5 to 20 alphanumeric characters" })
  rg?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salary?: number;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  lastLogin?: Date;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.replace(/\D/g, "") : value))
  @Matches(CPF_PATTERN, { message: "cpf must contain exactly 11 digits" })
  cpf?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.replace(/[^0-9A-Za-z]/g, "").toUpperCase() : value))
  @Matches(RG_PATTERN, { message: "rg must contain 5 to 20 alphanumeric characters" })
  rg?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salary?: number;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => toDate(value))
  lastLogin?: Date;
}
