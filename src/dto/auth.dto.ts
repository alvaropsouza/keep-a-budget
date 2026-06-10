import { IsEmail, IsObject, IsOptional, IsString, MinLength } from "class-validator";

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

export class BeginPasskeyAuthenticationDto {
  @IsEmail()
  email!: string;
}

export class VerifyPasskeyAuthenticationDto {
  @IsEmail()
  email!: string;

  @IsObject()
  response!: Record<string, unknown>;
}

export class VerifyPasskeyRegistrationDto {
  @IsObject()
  response!: Record<string, unknown>;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
