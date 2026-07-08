import { Injectable, Logger } from "@nestjs/common";
import { ExtraIncomeRepository } from "../../repositories/extra-income.repository";
import { AppError } from "../../utils/app-error";

export type DeleteExtraIncomeInput = { id: string; userId: string };

@Injectable()
export class DeleteExtraIncomeUseCase {
  private readonly logger = new Logger(DeleteExtraIncomeUseCase.name);

  constructor(private readonly extraIncomeRepository: ExtraIncomeRepository) {}

  async execute(input: DeleteExtraIncomeInput): Promise<void> {
    this.logger.log({ input }, "DeleteExtraIncomeUseCase.execute");

    const existing = await this.extraIncomeRepository.findById(input.id);
    if (!existing) throw new AppError("Resource not found", 404);
    if (existing.userId !== input.userId) {
      throw new AppError("Unauthorized to delete this extra income", 403);
    }

    await this.extraIncomeRepository.delete(input.id);
    this.logger.log({ id: input.id }, "DeleteExtraIncomeUseCase.execute done");
  }
}
