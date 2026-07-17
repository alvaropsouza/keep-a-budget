import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { RequestOtpDto, VerifyOtpDto, AuthenticateDto } from "../dto/auth.dto";
import { ApiTags } from "@nestjs/swagger";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { RateLimitGuard } from "../guards/rate-limit.guard";

const loginRateLimit = new RateLimitGuard(10, 15 * 60 * 1000, "Too many login attempts. Try again in 15 minutes.");
import { resolveSessionToken } from "../utils/session-token";
import type { AuthSession } from "../interfaces/auth";
import { RequestOtpUseCase } from "../use-cases/auth/request-otp.use-case";
import { VerifyOtpUseCase } from "../use-cases/auth/verify-otp.use-case";
import { AuthenticateTokenUseCase } from "../use-cases/auth/authenticate-token.use-case";
import { LogoutUseCase } from "../use-cases/auth/logout.use-case";
import { ListSessionsUseCase } from "../use-cases/auth/list-sessions.use-case";
import { RevokeSessionUseCase } from "../use-cases/auth/revoke-session.use-case";
import { RevokeOtherSessionsUseCase } from "../use-cases/auth/revoke-other-sessions.use-case";

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

const readDeviceId = (req: FastifyRequest): string | undefined => {
  const raw = req.headers["x-device-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.slice(0, 128);
};

const buildSessionContext = (req: FastifyRequest) => ({
  userAgent: req.headers["user-agent"]?.slice(0, 512),
  ipAddress: req.ip,
  deviceId: readDeviceId(req),
});

const toAuthPayload = (session: AuthSession) => ({
  userId: session.user.userId,
  email: session.user.email,
  name: session.user.name,
  expiresAt: session.expiresAt.toISOString(),
  sessionToken: session.sessionToken,
});

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly requestOtpUseCase: RequestOtpUseCase,
    private readonly verifyOtpUseCase: VerifyOtpUseCase,
    private readonly authenticateTokenUseCase: AuthenticateTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly listSessionsUseCase: ListSessionsUseCase,
    private readonly revokeSessionUseCase: RevokeSessionUseCase,
    private readonly revokeOtherSessionsUseCase: RevokeOtherSessionsUseCase,
  ) {}

  @UseGuards(loginRateLimit)
  @Post("otp/request")
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() body: RequestOtpDto) {
    await this.requestOtpUseCase.execute({ email: body.email });
    return { message: "Código de acesso enviado para seu email." };
  }

  @UseGuards(loginRateLimit)
  @Post("otp/verify")
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() body: VerifyOtpDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const session = await this.verifyOtpUseCase.execute({
      email: body.email,
      code: body.code,
      context: buildSessionContext(req),
    });
    reply.header("Set-Cookie", buildCookie(session.sessionToken, session.expiresAt));
    return { ...toAuthPayload(session), message: "Sessao iniciada com sucesso" };
  }

  @Post("authenticate")
  @HttpCode(HttpStatus.OK)
  async authenticate(
    @Body() body: AuthenticateDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const session = await this.authenticateTokenUseCase.execute({ token: body.token });
    reply.header("Set-Cookie", buildCookie(session.sessionToken, session.expiresAt));
    return toAuthPayload(session);
  }

  @Get("validate")
  async validate(@Req() req: FastifyRequest) {
    const token = resolveSessionToken(req);
    const session = await this.authenticateTokenUseCase.execute({ token: token ?? "" });
    return { valid: true, user: session.user, expiresAt: session.expiresAt.toISOString() };
  }

  @Get("me")
  async me(@Req() req: FastifyRequest) {
    const token = resolveSessionToken(req);
    const session = await this.authenticateTokenUseCase.execute({ token: token ?? "" });
    return {
      userId: session.user.userId,
      email: session.user.email,
      name: session.user.name,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  @UseGuards(SessionAuthGuard)
  @Get("sessions")
  async listSessions(@Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new UnauthorizedException();
    const token = resolveSessionToken(req) ?? "";
    const sessions = await this.listSessionsUseCase.execute({
      userId: authUser.userId,
      currentToken: token,
    });
    return { sessions };
  }

  @UseGuards(SessionAuthGuard)
  @Post("sessions/revoke-others")
  @HttpCode(HttpStatus.OK)
  async revokeOtherSessions(@Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new UnauthorizedException();
    const token = resolveSessionToken(req) ?? "";
    const revoked = await this.revokeOtherSessionsUseCase.execute({
      userId: authUser.userId,
      currentToken: token,
    });
    return { revoked };
  }

  @UseGuards(SessionAuthGuard)
  @Delete("sessions/:id")
  @HttpCode(HttpStatus.OK)
  async revokeSessionById(@Req() req: FastifyRequest, @Param("id") id: string) {
    const authUser = req.authUser;
    if (!authUser) throw new UnauthorizedException();
    const revoked = await this.revokeSessionUseCase.execute({
      userId: authUser.userId,
      sessionId: id,
    });
    if (!revoked) throw new NotFoundException("Sessao nao encontrada");
    return { message: "Sessao encerrada" };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const token = resolveSessionToken(req);
    await this.logoutUseCase.execute({ token });
    reply.header("Set-Cookie", clearCookie());
    return { message: "Sessao encerrada com sucesso" };
  }
}
