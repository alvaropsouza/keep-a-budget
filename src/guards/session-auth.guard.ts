import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { AuthenticateTokenUseCase } from "../use-cases/auth/authenticate-token.use-case";
import { resolveSessionToken } from "../utils/session-token";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    @Inject(AuthenticateTokenUseCase)
    private readonly authenticateTokenUseCase: AuthenticateTokenUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = resolveSessionToken(request);

    if (!token) throw new UnauthorizedException("Unauthorized");

    const session = await this.authenticateTokenUseCase.execute({ token });
    request.authUser = session.user;
    return true;
  }
}
