import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  Min,
  IsDate,
  MinLength,
} from "class-validator";
import { Transform } from "class-transformer";

const toDate = (value: unknown): Date | undefined =>
  value ? new Date(value as string) : undefined;

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsOptional()
  phone?: string;

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
  @MinLength(8)
  password?: string;

  @IsString()
  @IsOptional()
  phone?: string;

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
