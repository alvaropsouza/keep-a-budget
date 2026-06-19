import { Module } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { ResendService } from "../services/resend.service";
import { AuthController } from "./auth.controller";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { LoginRateLimitGuard } from "../guards/login-rate-limit.guard";

@Module({
  controllers: [AuthController],
  providers: [AuthService, ResendService, SessionAuthGuard, LoginRateLimitGuard],
  exports: [AuthService, SessionAuthGuard],
})
export class AuthModule {}
