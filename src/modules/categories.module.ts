import { Module } from "@nestjs/common";
import { CategoryService } from "../services/category.service";
import { CategoryController } from "./categories.controller";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
