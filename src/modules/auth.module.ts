import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { SessionRepository } from "../repositories/session.repository";
import { ResendService } from "../services/resend.service";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { LoginRateLimitGuard } from "../guards/login-rate-limit.guard";
import { RequestOtpUseCase } from "../use-cases/auth/request-otp.use-case";
import { VerifyOtpUseCase } from "../use-cases/auth/verify-otp.use-case";
import { AuthenticateTokenUseCase } from "../use-cases/auth/authenticate-token.use-case";
import { LogoutUseCase } from "../use-cases/auth/logout.use-case";
import { ListSessionsUseCase } from "../use-cases/auth/list-sessions.use-case";
import { RevokeSessionUseCase } from "../use-cases/auth/revoke-session.use-case";
import { RevokeOtherSessionsUseCase } from "../use-cases/auth/revoke-other-sessions.use-case";
import { PurgeStaleSessionsUseCase } from "../use-cases/auth/purge-stale-sessions.use-case";

@Module({
  controllers: [AuthController],
  providers: [
    SessionRepository,
    ResendService,
    RequestOtpUseCase,
    VerifyOtpUseCase,
    AuthenticateTokenUseCase,
    LogoutUseCase,
    ListSessionsUseCase,
    RevokeSessionUseCase,
    RevokeOtherSessionsUseCase,
    PurgeStaleSessionsUseCase,
    SessionAuthGuard,
    LoginRateLimitGuard,
  ],
  exports: [AuthenticateTokenUseCase, SessionAuthGuard],
})
export class AuthModule {}
