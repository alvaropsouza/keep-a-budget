import { Injectable, Logger } from "@nestjs/common";
import type { Category } from "../../generated/prisma/client/client";
import { CategoryRepository } from "../../repositories/category.repository";

export type ListCategoriesInput = { userId: string; includeHidden?: boolean };

@Injectable()
export class ListCategoriesUseCase {
  private readonly logger = new Logger(ListCategoriesUseCase.name);

  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: ListCategoriesInput): Promise<Category[]> {
    this.logger.log({ input }, "ListCategoriesUseCase.execute");
    await this.categoryRepository.ensureSeeded(input.userId);
    const result = await this.categoryRepository.findMany(input.userId, input.includeHidden ?? false);
    this.logger.log({ count: result.length }, "ListCategoriesUseCase.execute done");
    return result;
  }
}
