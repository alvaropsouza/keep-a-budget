import { Injectable, Logger } from "@nestjs/common";
import type { Category } from "../../generated/prisma/client/client";
import { CategoryRepository, PROTECTED_CATEGORY_NAME } from "../../repositories/category.repository";
import { AppError } from "../../utils/app-error";

export type UpdateCategoryInput = { id: string; userId: string; name?: string; icon?: string };

@Injectable()
export class UpdateCategoryUseCase {
  private readonly logger = new Logger(UpdateCategoryUseCase.name);

  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: UpdateCategoryInput): Promise<Category> {
    this.logger.log({ input }, "UpdateCategoryUseCase.execute");

    const category = await this.categoryRepository.findById(input.id);
    if (!category || category.userId !== input.userId) {
      throw new AppError("Categoria não encontrada", 404);
    }

    const patch: { name?: string; icon?: string } = {};

    if (input.icon !== undefined) patch.icon = input.icon;

    if (input.name !== undefined) {
      const trimmed = input.name.trim();
      if (!trimmed) throw new AppError("Nome da categoria é obrigatório", 400);
      if (category.name === PROTECTED_CATEGORY_NAME && trimmed !== PROTECTED_CATEGORY_NAME) {
        throw new AppError(`A categoria "${PROTECTED_CATEGORY_NAME}" não pode ser renomeada`, 400);
      }
      if (trimmed.toLowerCase() !== category.name.toLowerCase()) {
        const clash = await this.categoryRepository.findByNameInsensitive(input.userId, trimmed);
        if (clash && clash.id !== input.id) {
          throw new AppError("Já existe uma categoria com esse nome", 409);
        }
      }
      patch.name = trimmed;
    }

    const result = await this.categoryRepository.update(input.id, patch);
    this.logger.log({ id: result.id }, "UpdateCategoryUseCase.execute done");
    return result;
  }
}
