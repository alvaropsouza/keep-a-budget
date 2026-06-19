import { Injectable, Logger } from "@nestjs/common";
import type { Category } from "../../generated/prisma/client/client";
import { CategoryRepository } from "../../repositories/category.repository";

export type RestoreDefaultCategoriesInput = { userId: string };

@Injectable()
export class RestoreDefaultCategoriesUseCase {
  private readonly logger = new Logger(RestoreDefaultCategoriesUseCase.name);

  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: RestoreDefaultCategoriesInput): Promise<Category[]> {
    this.logger.log({ input }, "RestoreDefaultCategoriesUseCase.execute");

    await this.categoryRepository.ensureSeeded(input.userId);
    const existing = await this.categoryRepository.findAll(input.userId);
    await this.categoryRepository.restoreDefaults(input.userId, existing);

    const result = await this.categoryRepository.findMany(input.userId, false);
    this.logger.log({ count: result.length }, "RestoreDefaultCategoriesUseCase.execute done");
    return result;
  }
}
