import { Injectable, Logger } from "@nestjs/common";
import { IrDocumentRepository } from "../../repositories/ir-document.repository";
import type { IIrDocument } from "../../interfaces/ir-document";

export type GetIrDocumentsByYearInput = { userId: string; year: number };

@Injectable()
export class GetIrDocumentsByYearUseCase {
  private readonly logger = new Logger(GetIrDocumentsByYearUseCase.name);

  constructor(private readonly irDocumentRepository: IrDocumentRepository) {}

  async execute(input: GetIrDocumentsByYearInput): Promise<IIrDocument[]> {
    this.logger.log({ input }, "GetIrDocumentsByYearUseCase.execute");
    const result = await this.irDocumentRepository.findMany(input.userId, input.year);
    this.logger.log({ count: result.length }, "GetIrDocumentsByYearUseCase.execute done");
    return result;
  }
}
