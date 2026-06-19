import { Injectable, Logger } from "@nestjs/common";
import type { Category } from "../../generated/prisma/client/client";
import { CategoryRepository } from "../../repositories/category.repository";
import { AppError } from "../../utils/app-error";

export type CreateCategoryInput = { userId: string; name: string; icon: string };

@Injectable()
export class CreateCategoryUseCase {
  private readonly logger = new Logger(CreateCategoryUseCase.name);

  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    this.logger.log({ input }, "CreateCategoryUseCase.execute");

    await this.categoryRepository.ensureSeeded(input.userId);

    const trimmed = input.name.trim();
    if (!trimmed) throw new AppError("Nome da categoria é obrigatório", 400);

    const existing = await this.categoryRepository.findByNameInsensitive(input.userId, trimmed);
    if (existing) {
      if (existing.isHidden) {
        const result = await this.categoryRepository.update(existing.id, { isHidden: false, icon: input.icon });
        this.logger.log({ id: result.id }, "CreateCategoryUseCase.execute done (restored hidden)");
        return result;
      }
      throw new AppError("Já existe uma categoria com esse nome", 409);
    }

    const lastSortOrder = await this.categoryRepository.findLastSortOrder(input.userId);
    const result = await this.categoryRepository.create({
      userId: input.userId,
      name: trimmed,
      icon: input.icon,
      isDefault: false,
      sortOrder: lastSortOrder + 1,
    });

    this.logger.log({ id: result.id }, "CreateCategoryUseCase.execute done");
    return result;
  }
}
