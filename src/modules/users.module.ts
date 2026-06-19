import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { AuthModule } from "./auth.module";
import { CacheModule } from "./cache.module";
import { UserRepository } from "../repositories/user.repository";
import { GetUserByIdUseCase } from "../use-cases/users/get-user-by-id.use-case";
import { GetUserByEmailUseCase } from "../use-cases/users/get-user-by-email.use-case";
import { CreateUserUseCase } from "../use-cases/users/create-user.use-case";
import { UpdateUserUseCase } from "../use-cases/users/update-user.use-case";
import { DeleteUserUseCase } from "../use-cases/users/delete-user.use-case";

@Module({
  imports: [AuthModule, CacheModule],
  controllers: [UsersController],
  providers: [
    UserRepository,
    GetUserByIdUseCase,
    GetUserByEmailUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
  ],
  exports: [UserRepository],
})
export class UsersModule {}
