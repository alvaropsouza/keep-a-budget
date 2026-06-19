import { Injectable, Logger } from "@nestjs/common";
import { IrDocumentRepository } from "../../repositories/ir-document.repository";
import { S3Service } from "../../services/s3.service";
import { AppError } from "../../utils/app-error";

export type DeleteIrDocumentInput = { id: string; userId: string };

@Injectable()
export class DeleteIrDocumentUseCase {
  private readonly logger = new Logger(DeleteIrDocumentUseCase.name);

  constructor(
    private readonly irDocumentRepository: IrDocumentRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: DeleteIrDocumentInput): Promise<void> {
    this.logger.log({ input }, "DeleteIrDocumentUseCase.execute");

    const doc = await this.irDocumentRepository.findById(input.id);
    if (!doc) throw new AppError("Documento não encontrado", 404);
    if (doc.userId !== input.userId) throw new AppError("Sem permissão", 403);

    try {
      await this.s3Service.deleteObject(doc.receipt);
    } catch (err) {
      this.logger.error({ err, id: input.id }, "Failed to delete IR document from S3");
    }

    await this.irDocumentRepository.delete(input.id);
    this.logger.log({ id: input.id }, "DeleteIrDocumentUseCase.execute done");
  }
}
