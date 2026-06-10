import {
  Controller,
  Delete,
  Get,
  Inject,
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
import { UserService } from "../services/user.service";
import { CreateUserDto, UpdateUserDto } from "../dto/user.dto";
import { SessionAuthGuard } from "./session-auth.guard";
import { RegistrationRateLimitGuard } from "../guards/registration-rate-limit.guard";
import { AppError } from "../utils/AppError";

@Controller("users")
export class UsersController {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  async getAll(@Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    const user = await this.userService.findById(authUser.userId);
    return [user];
  }

  @UseGuards(SessionAuthGuard)
  @Get("by-email/:email")
  async getByEmail(@Param("email") email: string, @Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    const normalized = email.trim().toLowerCase();
    if (normalized !== authUser.email) throw new AppError("Unauthorized", 403);
    return this.userService.findByEmail(email, true);
  }

  @UseGuards(SessionAuthGuard)
  @Get(":id")
  async getById(@Param("id") id: string, @Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    if (id !== authUser.userId) throw new AppError("Unauthorized", 403);
    return this.userService.findById(id);
  }

  @Post()
  @UseGuards(RegistrationRateLimitGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateUserDto) {
    if (process.env.REGISTRATION_OPEN !== "true") {
      throw new AppError("Registration is closed", 403);
    }
    return this.userService.createUser(body);
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
    return this.userService.update(id, body);
  }

  @UseGuards(SessionAuthGuard)
  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    if (id !== authUser.userId) throw new AppError("Unauthorized", 403);
    await this.userService.delete(id);
    return { message: "User deleted successfully" };
  }
}
