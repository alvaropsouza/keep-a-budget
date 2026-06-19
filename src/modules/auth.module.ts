import { Module } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { EmailService } from "../services/email.service";
import { AuthController } from "./auth.controller";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { LoginRateLimitGuard } from "../guards/login-rate-limit.guard";

@Module({
  controllers: [AuthController],
  providers: [AuthService, EmailService, SessionAuthGuard, LoginRateLimitGuard],
  exports: [AuthService, SessionAuthGuard],
})
export class AuthModule {}
