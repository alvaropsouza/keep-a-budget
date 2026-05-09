import { Module } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { UsersHttpController } from "./users-http.controller";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [UsersHttpController],
  providers: [UserService],
})
export class UsersModule {}
