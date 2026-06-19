import { Injectable, Logger } from "@nestjs/common";
import { IrDocumentRepository } from "../../repositories/ir-document.repository";
import { S3Service } from "../../services/s3.service";
import type { IIrDocument } from "../../interfaces/ir-document";

export type CreateIrDocumentInput = {
  userId: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
  userEmail?: string;
  file: { buffer: Buffer; filename: string; mimetype: string };
};

@Injectable()
export class CreateIrDocumentUseCase {
  private readonly logger = new Logger(CreateIrDocumentUseCase.name);

  constructor(
    private readonly irDocumentRepository: IrDocumentRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: CreateIrDocumentInput): Promise<IIrDocument> {
    this.logger.log({ userId: input.userId, category: input.category }, "CreateIrDocumentUseCase.execute");

    const s3Key = await this.s3Service.upload(input.file.buffer, input.file.filename, input.file.mimetype, {
      keyPrefix: "ir-documents",
      userEmail: input.userEmail,
    });

    const date = new Date(input.date);
    const year = date.getUTCFullYear();

    const result = await this.irDocumentRepository.create({
      userId: input.userId,
      date,
      category: input.category,
      amount: input.amount,
      description: input.description,
      receipt: s3Key,
      year,
    });

    this.logger.log({ id: result.id, year }, "CreateIrDocumentUseCase.execute done");
    return result;
  }
}
