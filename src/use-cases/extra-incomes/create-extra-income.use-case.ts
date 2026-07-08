import { Injectable, Logger } from "@nestjs/common";
import { ExtraIncomeRepository } from "../../repositories/extra-income.repository";
import type { IExtraIncome } from "../../interfaces/extra-income";
import type { CreateExtraIncomeDto } from "../../dto/extra-income.dto";

export type CreateExtraIncomeInput = CreateExtraIncomeDto & { userId: string };

@Injectable()
export class CreateExtraIncomeUseCase {
  private readonly logger = new Logger(CreateExtraIncomeUseCase.name);

  constructor(private readonly extraIncomeRepository: ExtraIncomeRepository) {}

  async execute(input: CreateExtraIncomeInput): Promise<IExtraIncome> {
    this.logger.log({ userId: input.userId, description: input.description }, "CreateExtraIncomeUseCase.execute");

    const result = await this.extraIncomeRepository.create(input);

    this.logger.log({ id: result.id, amount: result.amount }, "CreateExtraIncomeUseCase.execute done");
    return result;
  }
}
