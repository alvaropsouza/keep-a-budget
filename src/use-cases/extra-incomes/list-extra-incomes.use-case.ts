import { Injectable, Logger } from "@nestjs/common";
import { ExtraIncomeRepository } from "../../repositories/extra-income.repository";
import type { IExtraIncome } from "../../interfaces/extra-income";
import type { ExtraIncomeQueryParamsDto } from "../../dto/extra-income.dto";

export type ListExtraIncomesInput = { userId: string; query: ExtraIncomeQueryParamsDto };

@Injectable()
export class ListExtraIncomesUseCase {
  private readonly logger = new Logger(ListExtraIncomesUseCase.name);

  constructor(private readonly extraIncomeRepository: ExtraIncomeRepository) {}

  async execute(input: ListExtraIncomesInput): Promise<IExtraIncome[]> {
    this.logger.log({ input }, "ListExtraIncomesUseCase.execute");

    const result = await this.extraIncomeRepository.findMany(input.userId, input.query);

    this.logger.log({ count: result.length }, "ListExtraIncomesUseCase.execute done");
    return result;
  }
}
