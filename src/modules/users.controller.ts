import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { CreateUserDto, UpdateUserDto } from "../dto/user.dto";
import { ApiTags } from "@nestjs/swagger";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { RegistrationRateLimitGuard } from "../guards/registration-rate-limit.guard";
import { AppError } from "../utils/app-error";
import { GetUserByIdUseCase } from "../use-cases/users/get-user-by-id.use-case";
import { GetUserByEmailUseCase } from "../use-cases/users/get-user-by-email.use-case";
import { CreateUserUseCase } from "../use-cases/users/create-user.use-case";
import { UpdateUserUseCase } from "../use-cases/users/update-user.use-case";
import { DeleteUserUseCase } from "../use-cases/users/delete-user.use-case";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly getUserByEmailUseCase: GetUserByEmailUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  async getAll(@Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    const user = await this.getUserByIdUseCase.execute({ id: authUser.userId });
    return [user];
  }

  @UseGuards(SessionAuthGuard)
  @Get("by-email/:email")
  async getByEmail(@Param("email") email: string, @Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    const normalized = email.trim().toLowerCase();
    if (normalized !== authUser.email) throw new AppError("Unauthorized", 403);
    return this.getUserByEmailUseCase.execute({ email, updateLastLogin: true });
  }

  @UseGuards(SessionAuthGuard)
  @Get(":id")
  async getById(@Param("id") id: string, @Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    if (id !== authUser.userId) throw new AppError("Unauthorized", 403);
    return this.getUserByIdUseCase.execute({ id });
  }

  @Post()
  @UseGuards(RegistrationRateLimitGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateUserDto) {
    if (process.env.REGISTRATION_OPEN !== "true") {
      throw new AppError("Registration is closed", 403);
    }
    return this.createUserUseCase.execute(body);
  }

  @UseGuards(SessionAuthGuard)
  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() body: UpdateUserDto,
    @Req() req: FastifyRequest,
  ) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    if (id !== authUser.userId) throw new AppError("Unauthorized", 403);
    return this.updateUserUseCase.execute({ id, ...body });
  }

  @UseGuards(SessionAuthGuard)
  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    if (id !== authUser.userId) throw new AppError("Unauthorized", 403);
    await this.deleteUserUseCase.execute({ id });
    return { message: "User deleted successfully" };
  }
}
