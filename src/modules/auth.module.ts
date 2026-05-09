import { Module } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { AuthHttpController } from "./auth-http.controller";
import { SessionAuthGuard } from "./session-auth.guard";

@Module({
  controllers: [AuthHttpController],
  providers: [AuthService, SessionAuthGuard],
  exports: [AuthService, SessionAuthGuard],
})
export class AuthModule {}
