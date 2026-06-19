import { Injectable, Logger } from "@nestjs/common";
import { IrDocumentRepository } from "../../repositories/ir-document.repository";
import { S3Service } from "../../services/s3.service";
import type { IIrDocument } from "../../interfaces/ir-document";

export type ListIrDocumentsInput = { userId: string; year: number };

@Injectable()
export class ListIrDocumentsUseCase {
  private readonly logger = new Logger(ListIrDocumentsUseCase.name);

  constructor(
    private readonly irDocumentRepository: IrDocumentRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: ListIrDocumentsInput): Promise<IIrDocument[]> {
    this.logger.log({ input }, "ListIrDocumentsUseCase.execute");

    const documents = await this.irDocumentRepository.findMany(input.userId, input.year);

    const result = await Promise.all(
      documents.map(async (doc) => {
        try {
          const signedUrl = await this.s3Service.getSignedUrl(doc.receipt);
          return { ...doc, receipt: signedUrl };
        } catch (err) {
          this.logger.error({ err, irDocumentId: doc.id }, "Failed to sign IR document URL");
          return doc;
        }
      }),
    );

    this.logger.log({ count: result.length }, "ListIrDocumentsUseCase.execute done");
    return result;
  }
}
