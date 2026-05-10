import { Module } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { UsersController } from "./users.controller";
import { AuthModule } from "./auth.module";
import { CacheModule } from "./cache.module";

@Module({
  imports: [AuthModule, CacheModule],
  controllers: [UsersController],
  providers: [UserService],
})
export class UsersModule {}
