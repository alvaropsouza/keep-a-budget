import { test } from "node:test";
import assert from "node:assert/strict";
import type { ExecutionContext } from "@nestjs/common";
import { RateLimitGuard } from "../../src/guards/rate-limit.guard";

const contextFor = (request: { ip?: string; url: string; authUser?: { userId: string } }): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

test("blocks the caller once the window limit is reached", () => {
  const guard = new RateLimitGuard(2, 60_000, "Too many requests");
  const ctx = contextFor({ ip: "1.1.1.1", url: "/ai/parse-expense" });

  assert.equal(guard.canActivate(ctx), true);
  assert.equal(guard.canActivate(ctx), true);
  assert.throws(() => guard.canActivate(ctx), /Too many requests/);
});

test("counts authenticated callers per user, not per shared ip", () => {
  const guard = new RateLimitGuard(1, 60_000, "Too many requests");
  const first = contextFor({ ip: "1.1.1.1", url: "/ai/parse-expense", authUser: { userId: "user-1" } });
  const second = contextFor({ ip: "1.1.1.1", url: "/ai/parse-expense", authUser: { userId: "user-2" } });

  assert.equal(guard.canActivate(first), true);
  assert.equal(guard.canActivate(second), true);
  assert.throws(() => guard.canActivate(first), /Too many requests/);
});
