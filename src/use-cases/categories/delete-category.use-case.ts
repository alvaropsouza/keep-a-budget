import { Injectable, Logger } from "@nestjs/common";
import type { Category } from "../../generated/prisma/client/client";
import { CategoryRepository, PROTECTED_CATEGORY_NAME } from "../../repositories/category.repository";
import { AppError } from "../../utils/app-error";

export type DeleteCategoryInput = { id: string; userId: string };

@Injectable()
export class DeleteCategoryUseCase {
  private readonly logger = new Logger(DeleteCategoryUseCase.name);

  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: DeleteCategoryInput): Promise<Category> {
    this.logger.log({ input }, "DeleteCategoryUseCase.execute");

    const category = await this.categoryRepository.findById(input.id);
    if (!category || category.userId !== input.userId) {
      throw new AppError("Categoria não encontrada", 404);
    }
    if (category.name === PROTECTED_CATEGORY_NAME) {
      throw new AppError(`A categoria "${PROTECTED_CATEGORY_NAME}" não pode ser removida`, 400);
    }

    const result = category.isDefault
      ? await this.categoryRepository.update(input.id, { isHidden: true })
      : await this.categoryRepository.delete(input.id);

    this.logger.log({ id: input.id }, "DeleteCategoryUseCase.execute done");
    return result;
  }
}
