import { Module } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { UsersController } from "./users.controller";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UserService],
})
export class UsersModule {}
