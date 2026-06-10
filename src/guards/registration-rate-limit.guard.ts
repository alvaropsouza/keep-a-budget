import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { AppError } from "../utils/AppError";

@Injectable()
export class RegistrationRateLimitGuard implements CanActivate {
  private readonly store = new Map<string, { count: number; resetAt: number }>();
  private readonly MAX = 5;
  private readonly WINDOW = 60 * 60 * 1000; // 1 hour

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();
    const forwarded = req.headers["x-forwarded-for"] as string | undefined;
    const ip = forwarded?.split(",")[0].trim() ?? req.ip ?? "unknown";
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || entry.resetAt < now) {
      this.store.set(ip, { count: 1, resetAt: now + this.WINDOW });
      return true;
    }

    if (entry.count >= this.MAX) {
      throw new AppError("Muitas tentativas de registro. Tente novamente em 1 hora.", 429);
    }

    entry.count++;
    return true;
  }
}
