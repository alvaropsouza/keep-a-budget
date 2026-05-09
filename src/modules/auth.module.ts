import { Module } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { AuthController } from "./auth.controller";
import { SessionAuthGuard } from "./session-auth.guard";

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionAuthGuard],
  exports: [AuthService, SessionAuthGuard],
})
export class AuthModule {}
