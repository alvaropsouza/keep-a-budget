import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { AppError } from "../utils/AppError";

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private readonly store = new Map<string, { count: number; resetAt: number }>();
  private readonly MAX = 10;
  private readonly WINDOW = 15 * 60 * 1000;

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();
    const forwarded = req.headers["x-forwarded-for"] as string | undefined;
    const ip = forwarded?.split(",")[0].trim() ?? req.ip ?? "unknown";
    const key = `${ip}:${req.url}`;
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      this.store.set(key, { count: 1, resetAt: now + this.WINDOW });
      return true;
    }

    if (entry.count >= this.MAX) {
      throw new AppError("Too many login attempts. Try again in 15 minutes.", 429);
    }

    entry.count++;
    return true;
  }
}
