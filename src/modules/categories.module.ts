import { Module } from "@nestjs/common";
import { CategoryController } from "./categories.controller";
import { CategoryRepository } from "../repositories/category.repository";
import { ListCategoriesUseCase } from "../use-cases/categories/list-categories.use-case";
import { CreateCategoryUseCase } from "../use-cases/categories/create-category.use-case";
import { UpdateCategoryUseCase } from "../use-cases/categories/update-category.use-case";
import { DeleteCategoryUseCase } from "../use-cases/categories/delete-category.use-case";
import { RestoreDefaultCategoriesUseCase } from "../use-cases/categories/restore-default-categories.use-case";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [CategoryController],
  providers: [
    CategoryRepository,
    ListCategoriesUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    RestoreDefaultCategoriesUseCase,
  ],
  exports: [CategoryRepository],
})
export class CategoryModule {}
