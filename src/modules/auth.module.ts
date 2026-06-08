import { Module } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { AuthController } from "./auth.controller";
import { SessionAuthGuard } from "./session-auth.guard";
import { LoginRateLimitGuard } from "../guards/login-rate-limit.guard";

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionAuthGuard, LoginRateLimitGuard],
  exports: [AuthService, SessionAuthGuard],
})
export class AuthModule {}
