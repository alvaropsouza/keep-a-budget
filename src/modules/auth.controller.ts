import {
  Controller,
  Get,
  Inject,
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
import {
  RequestOtpDto,
  VerifyOtpDto,
  AuthenticateDto,
} from "../dto/auth.dto";
import { AuthService, AuthSession } from "../services/auth.service";
import { EmailService } from "../services/email.service";
import { resolveSessionToken } from "../utils/session-token";
import { ApiTags } from "@nestjs/swagger";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { LoginRateLimitGuard } from "../guards/login-rate-limit.guard";

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

// Capture where/what the login came from. User-Agent is capped to a sane
// length to avoid storing oversized header values. X-Device-Id is the client's
// stable per-device id (localStorage UUID) used to keep one session per device.
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
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const session = await this.authService.verifyEmailOtp(
      body.email,
      body.code,
      buildSessionContext(req),
    );
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

  @UseGuards(SessionAuthGuard)
  @Get("sessions")
  async listSessions(@Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new UnauthorizedException();
    }
    const token = resolveSessionToken(req) ?? "";
    const sessions = await this.authService.listSessions(authUser.userId, token);
    return { sessions };
  }

  @UseGuards(SessionAuthGuard)
  @Post("sessions/revoke-others")
  @HttpCode(HttpStatus.OK)
  async revokeOtherSessions(@Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new UnauthorizedException();
    }
    const token = resolveSessionToken(req) ?? "";
    const revoked = await this.authService.revokeOtherSessions(
      authUser.userId,
      token,
    );
    return { revoked };
  }

  @UseGuards(SessionAuthGuard)
  @Delete("sessions/:id")
  @HttpCode(HttpStatus.OK)
  async revokeSessionById(
    @Req() req: FastifyRequest,
    @Param("id") id: string,
  ) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new UnauthorizedException();
    }
    const revoked = await this.authService.revokeSessionById(authUser.userId, id);
    if (!revoked) {
      throw new NotFoundException("Sessao nao encontrada");
    }
    return { message: "Sessao encerrada" };
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
