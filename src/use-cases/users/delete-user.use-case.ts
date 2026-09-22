import { Injectable, Logger } from "@nestjs/common";
import type { IUser } from "../../interfaces/user";
import { UserRepository } from "../../repositories/user.repository";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { IrDocumentRepository } from "../../repositories/ir-document.repository";
import { VehicleRevisionRepository } from "../../repositories/vehicle-revision.repository";
import { S3Service } from "../../services/s3.service";

export type DeleteUserInput = { id: string };

@Injectable()
export class DeleteUserUseCase {
  private readonly logger = new Logger(DeleteUserUseCase.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly expenseRepository: ExpenseRepository,
    private readonly irDocumentRepository: IrDocumentRepository,
    private readonly revisionRepository: VehicleRevisionRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: DeleteUserInput): Promise<IUser> {
    this.logger.log({ id: input.id }, "DeleteUserUseCase.execute");

    const [receipts, irReceipts, revisionFiles] = await Promise.all([
      this.expenseRepository.findReceiptKeysByUser(input.id),
      this.irDocumentRepository.findReceiptKeysByUser(input.id),
      this.revisionRepository.findFileKeysByUser(input.id),
    ]);

    const result = await this.userRepository.delete(input.id);

    const files = [...receipts, ...irReceipts, ...revisionFiles];
    if (files.length > 0) await this.s3Service.deleteObjects(files);

    this.logger.log({ id: result.id, filesRemoved: files.length }, "DeleteUserUseCase.execute done");
    return result;
  }
}
