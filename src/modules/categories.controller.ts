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
import { CreateCategoryDto, UpdateCategoryDto } from "../dto/category.dto";
import { ApiTags } from "@nestjs/swagger";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { AppError } from "../utils/app-error";
import { ListCategoriesUseCase } from "../use-cases/categories/list-categories.use-case";
import { CreateCategoryUseCase } from "../use-cases/categories/create-category.use-case";
import { UpdateCategoryUseCase } from "../use-cases/categories/update-category.use-case";
import { DeleteCategoryUseCase } from "../use-cases/categories/delete-category.use-case";
import { RestoreDefaultCategoriesUseCase } from "../use-cases/categories/restore-default-categories.use-case";

@ApiTags("categories")
@UseGuards(SessionAuthGuard)
@Controller("categories")
export class CategoryController {
  constructor(
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly restoreDefaultCategoriesUseCase: RestoreDefaultCategoriesUseCase,
  ) {}

  @Get()
  async list(@Req() req: FastifyRequest) {
    return this.listCategoriesUseCase.execute({ userId: this.authUserId(req) });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateCategoryDto, @Req() req: FastifyRequest) {
    return this.createCategoryUseCase.execute({ ...body, userId: this.authUserId(req) });
  }

  @Post("restore-defaults")
  @HttpCode(HttpStatus.OK)
  async restoreDefaults(@Req() req: FastifyRequest) {
    return this.restoreDefaultCategoriesUseCase.execute({ userId: this.authUserId(req) });
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: UpdateCategoryDto, @Req() req: FastifyRequest) {
    return this.updateCategoryUseCase.execute({ ...body, id, userId: this.authUserId(req) });
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Req() req: FastifyRequest) {
    await this.deleteCategoryUseCase.execute({ id, userId: this.authUserId(req) });
    return { message: "Category removed" };
  }

  private authUserId(req: FastifyRequest): string {
    if (!req.authUser) throw new AppError("Unauthorized", 401);
    return req.authUser.userId;
  }
}
