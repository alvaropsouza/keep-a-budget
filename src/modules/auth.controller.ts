import {
  Controller,
  Get,
  Inject,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  RequestOtpDto,
  VerifyOtpDto,
  AuthenticateDto,
  BeginPasskeyAuthenticationDto,
  VerifyPasskeyAuthenticationDto,
  VerifyPasskeyRegistrationDto,
} from "../dto/auth.dto";
import { AuthService, AuthSession } from "../services/auth.service";
import { EmailService } from "../services/email.service";
import { resolveSessionToken } from "../utils/sessionToken";
import { SessionAuthGuard } from "./session-auth.guard";
import { LoginRateLimitGuard } from "../guards/login-rate-limit.guard";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "kab_session";
const IS_PROD = process.env.NODE_ENV === "production";

const buildCookie = (token: string, expiresAt: Date): string => {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  const securePart = IS_PROD ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${securePart}`;
};

const clearCookie = (): string => {
  const securePart = IS_PROD ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${securePart}`;
};

const toAuthPayload = (session: AuthSession) => ({
  userId: session.user.userId,
  email: session.user.email,
  name: session.user.name,
  expiresAt: session.expiresAt.toISOString(),
  sessionToken: session.sessionToken,
});

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(EmailService) private readonly emailService: EmailService,
  ) {}

  @UseGuards(LoginRateLimitGuard)
  @Post("otp/request")
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() body: RequestOtpDto) {
    const result = await this.authService.requestEmailOtp(body.email);
    if (result) {
      await this.emailService.sendLoginCode(result.userEmail, result.code);
    }
    // Always return 200 to prevent email enumeration
    return { message: "Se o email existir, você receberá um código de acesso." };
  }

  @UseGuards(LoginRateLimitGuard)
  @Post("otp/verify")
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() body: VerifyOtpDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const session = await this.authService.verifyEmailOtp(body.email, body.code);
    reply.header("Set-Cookie", buildCookie(session.sessionToken, session.expiresAt));
    return { ...toAuthPayload(session), message: "Sessao iniciada com sucesso" };
  }

  @Post("authenticate")
  @HttpCode(HttpStatus.OK)
  async authenticate(
    @Body() body: AuthenticateDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const session = await this.authService.authenticateToken(body.token);
    reply.header("Set-Cookie", buildCookie(session.sessionToken, session.expiresAt));
    return toAuthPayload(session);
  }

  @UseGuards(SessionAuthGuard)
  @Post("webauthn/register/options")
  async beginPasskeyRegistration(@Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new UnauthorizedException();
    }

    return this.authService.beginPasskeyRegistration(authUser.userId);
  }

  @UseGuards(SessionAuthGuard)
  @Post("webauthn/register/verify")
  async verifyPasskeyRegistration(
    @Req() req: FastifyRequest,
    @Body() body: VerifyPasskeyRegistrationDto,
  ) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new UnauthorizedException();
    }

    return this.authService.verifyPasskeyRegistration(
      authUser.userId,
      body.response as unknown as RegistrationResponseJSON,
    );
  }

  @UseGuards(LoginRateLimitGuard)
  @Post("webauthn/login/options")
  async beginPasskeyAuthentication(@Body() body: BeginPasskeyAuthenticationDto) {
    return this.authService.beginPasskeyAuthentication(body.email);
  }

  @Post("webauthn/login/verify")
  async verifyPasskeyAuthentication(
    @Body() body: VerifyPasskeyAuthenticationDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const session = await this.authService.verifyPasskeyAuthentication(
      body.email,
      body.response as unknown as AuthenticationResponseJSON,
    );
    reply.header("Set-Cookie", buildCookie(session.sessionToken, session.expiresAt));
    return toAuthPayload(session);
  }

  @Get("validate")
  async validate(@Req() req: FastifyRequest) {
    const token = resolveSessionToken(req);
    const session = await this.authService.authenticateToken(token ?? "");
    return {
      valid: true,
      user: session.user,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  @Get("me")
  async me(@Req() req: FastifyRequest) {
    const token = resolveSessionToken(req);
    const session = await this.authService.authenticateToken(token ?? "");
    return {
      userId: session.user.userId,
      email: session.user.email,
      name: session.user.name,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const token = resolveSessionToken(req);
    await this.authService.revokeSession(token);
    reply.header("Set-Cookie", clearCookie());
    return { message: "Sessao encerrada com sucesso" };
  }
}
