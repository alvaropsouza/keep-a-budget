import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { AuthService } from "../services/auth.service";
import { resolveSessionToken } from "../utils/session-token";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = resolveSessionToken(request);

    if (!token) {
      throw new UnauthorizedException("Unauthorized");
    }

    const session = await this.authService.authenticateToken(token);
    request.authUser = session.user;

    return true;
  }
}
