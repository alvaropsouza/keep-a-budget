import { Injectable, Logger } from "@nestjs/common";
import { FixedExpenseRepository } from "../../repositories/fixed-expense.repository";

export type GetTotalFixedExpensesInput = { userId: string };

@Injectable()
export class GetTotalFixedExpensesUseCase {
  private readonly logger = new Logger(GetTotalFixedExpensesUseCase.name);

  constructor(private readonly fixedExpenseRepository: FixedExpenseRepository) {}

  async execute(input: GetTotalFixedExpensesInput): Promise<number> {
    this.logger.log({ input }, "GetTotalFixedExpensesUseCase.execute");

    const active = await this.fixedExpenseRepository.findMany(input.userId, true);
    const total = active.reduce((sum, e) => sum + e.amount, 0);

    this.logger.log({ total }, "GetTotalFixedExpensesUseCase.execute done");
    return total;
  }
}
