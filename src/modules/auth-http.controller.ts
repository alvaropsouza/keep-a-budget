import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { LoginDto, AuthenticateDto } from "../dto/auth.dto";
import { AuthService, AuthSession } from "../services/auth.service";
import { resolveSessionToken } from "../utils/sessionToken";

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
export class AuthHttpController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const session = await this.authService.loginWithEmail(body.email, body.password);
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
