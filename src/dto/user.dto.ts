import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  Min,
  IsDateString,
  MinLength,
} from "class-validator";

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

  @IsDateString()
  @IsOptional()
  lastLogin?: string;
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

  @IsDateString()
  @IsOptional()
  lastLogin?: string;
}
