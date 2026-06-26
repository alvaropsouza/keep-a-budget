import { Injectable } from "@nestjs/common";
import { StockTransactionRepository } from "../../repositories/stock-transaction.repository";

interface GetTopBrokersInput {
  userId: string;
}

export interface GetTopBrokersOutput {
  brokers: string[];
}

@Injectable()
export class GetTopBrokersUseCase {
  constructor(private readonly repo: StockTransactionRepository) {}

  async execute(input: GetTopBrokersInput): Promise<GetTopBrokersOutput> {
    const brokers = await this.repo.findTopBrokers(input.userId);
    return { brokers };
  }
}
