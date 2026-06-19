import { Injectable, Logger } from "@nestjs/common";
import { FixedExpenseRepository } from "../../repositories/fixed-expense.repository";
import type { IFixedExpense } from "../../interfaces/fixed-expense";
import type { CreateFixedExpenseDto } from "../../dto/fixed-expense.dto";

export type CreateFixedExpenseInput = CreateFixedExpenseDto & { userId: string };

@Injectable()
export class CreateFixedExpenseUseCase {
  private readonly logger = new Logger(CreateFixedExpenseUseCase.name);

  constructor(private readonly fixedExpenseRepository: FixedExpenseRepository) {}

  async execute(input: CreateFixedExpenseInput): Promise<IFixedExpense> {
    this.logger.log({ userId: input.userId, name: input.name }, "CreateFixedExpenseUseCase.execute");

    const result = await this.fixedExpenseRepository.create(input);

    this.logger.log({ id: result.id, amount: result.amount }, "CreateFixedExpenseUseCase.execute done");
    return result;
  }
}
