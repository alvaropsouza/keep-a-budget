import { Injectable, Logger } from "@nestjs/common";
import type { Category } from "../../generated/prisma/client/client";
import {
  CategoryRepository,
  PROTECTED_CATEGORY_NAME,
  PROTECTED_CATEGORY_ICON,
} from "../../repositories/category.repository";
import { AppError } from "../../errors/app-error";
import { runWithTransaction } from "../../utils/run-with-transaction";

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

    if (category.isDefault) {
      const hidden = await this.categoryRepository.update(input.id, { isHidden: true });
      this.logger.log({ id: input.id, hidden: true }, "DeleteCategoryUseCase.execute done");
      return hidden;
    }

    await this.categoryRepository.ensureExists(
      input.userId,
      PROTECTED_CATEGORY_NAME,
      PROTECTED_CATEGORY_ICON,
    );

    const result = await runWithTransaction(
      async (tx) => {
        await this.categoryRepository.renameUsages(input.userId, category.name, PROTECTED_CATEGORY_NAME, tx);
        return this.categoryRepository.delete(input.id, tx);
      },
      { operationName: "category.delete", metadata: { categoryId: input.id, name: category.name } },
    );

    this.logger.log({ id: input.id }, "DeleteCategoryUseCase.execute done");
    return result;
  }
}
