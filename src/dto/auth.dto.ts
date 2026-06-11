import { IsEmail, IsObject, IsString, Matches, MinLength } from "class-validator";

export class RequestOtpDto {
  @IsEmail()
  email!: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: "code must be a 6-digit number" })
  code!: string;
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

