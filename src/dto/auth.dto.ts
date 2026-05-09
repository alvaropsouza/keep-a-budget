import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsOptional()
  locale?: string;
}

export class AuthenticateDto {
  @IsString()
  @MinLength(16)
  token!: string;
}
