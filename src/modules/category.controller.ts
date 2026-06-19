import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { CategoryService } from "../services/category.service";
import { CreateCategoryDto, UpdateCategoryDto } from "../dto/category.dto";
import { ApiTags } from "@nestjs/swagger";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { AppError } from "../utils/app-error";

@ApiTags("categories")
@UseGuards(SessionAuthGuard)
@Controller("categories")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async list(@Req() req: FastifyRequest) {
    const { userId } = this.getAuthUser(req);
    return this.categoryService.list(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateCategoryDto, @Req() req: FastifyRequest) {
    const { userId } = this.getAuthUser(req);
    return this.categoryService.create(userId, body.name, body.icon);
  }

  @Post("restore-defaults")
  @HttpCode(HttpStatus.OK)
  async restoreDefaults(@Req() req: FastifyRequest) {
    const { userId } = this.getAuthUser(req);
    return this.categoryService.restoreDefaults(userId);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() body: UpdateCategoryDto,
    @Req() req: FastifyRequest,
  ) {
    const { userId } = this.getAuthUser(req);
    return this.categoryService.update(id, userId, body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Req() req: FastifyRequest) {
    const { userId } = this.getAuthUser(req);
    await this.categoryService.remove(id, userId);
    return { message: "Category removed" };
  }

  private getAuthUser(req: FastifyRequest) {
    if (!req.authUser) throw new AppError("Unauthorized", 401);
    return req.authUser;
  }
}
