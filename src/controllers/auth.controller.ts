import { FastifyReply, FastifyRequest } from "fastify";
import { BaseController } from "./base.controller";
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

export class AuthController extends BaseController {
  private service: AuthService;

  constructor() {
    super();
    this.service = new AuthService();
  }

  login = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      if (!(await this.validate(LoginDto, request.body, reply))) {
        return;
      }

      const { email } = request.body as LoginDto;
      const session = await this.service.loginWithEmail(email);

      reply.header("Set-Cookie", buildCookie(session.sessionToken, session.expiresAt));
      reply.send({
        ...toAuthPayload(session),
        message: "Sessao iniciada com sucesso",
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  authenticate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      if (!(await this.validate(AuthenticateDto, request.body, reply))) {
        return;
      }

      const { token } = request.body as AuthenticateDto;
      const session = await this.service.authenticateToken(token);
      reply.header("Set-Cookie", buildCookie(session.sessionToken, session.expiresAt));
      reply.send(toAuthPayload(session));
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  validateSession = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const token = resolveSessionToken(request);
      const session = await this.service.authenticateToken(token ?? "");
      reply.send({
        valid: true,
        user: session.user,
        expiresAt: session.expiresAt.toISOString(),
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  me = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const token = resolveSessionToken(request);
      const session = await this.service.authenticateToken(token ?? "");
      reply.send({
        userId: session.user.userId,
        email: session.user.email,
        name: session.user.name,
        expiresAt: session.expiresAt.toISOString(),
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  logout = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const token = resolveSessionToken(request);
      await this.service.revokeSession(token);
      reply.header("Set-Cookie", clearCookie());
      reply.send({ message: "Sessao encerrada com sucesso" });
    } catch (error) {
      this.handleError(error, reply);
    }
  };
}

const authController = new AuthController();

export const {
  login,
  authenticate,
  validateSession,
  me,
  logout,
} = authController;
