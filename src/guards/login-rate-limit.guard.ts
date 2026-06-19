import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { AppError } from "../utils/app-error";

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private readonly store = new Map<string, { count: number; resetAt: number }>();
  private readonly MAX = 10;
  private readonly WINDOW = 15 * 60 * 1000;
  private lastSweep = 0;

  // Evict expired entries so the store can't grow unbounded (memory DoS).
  private sweep(now: number): void {
    if (now - this.lastSweep < this.WINDOW) return;
    this.lastSweep = now;
    for (const [key, entry] of this.store) {
      if (entry.resetAt < now) this.store.delete(key);
    }
  }

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();
    // req.ip is resolved by Fastify via trustProxy; never trust the raw
    // X-Forwarded-For header, which the client can spoof to bypass the limit.
    const ip = req.ip ?? "unknown";
    const key = `${ip}:${req.url}`;
    const now = Date.now();
    this.sweep(now);
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
