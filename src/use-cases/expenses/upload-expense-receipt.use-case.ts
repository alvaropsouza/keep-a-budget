import { Injectable, Logger } from "@nestjs/common";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { S3Service } from "../../services/s3.service";
import { AppError } from "../../utils/app-error";
import type { IExpense } from "../../interfaces/expense";

export type UploadExpenseReceiptInput = {
  id: string;
  userId: string;
  file: { buffer: Buffer; filename: string; mimetype: string; userEmail?: string };
};

@Injectable()
export class UploadExpenseReceiptUseCase {
  private readonly logger = new Logger(UploadExpenseReceiptUseCase.name);

  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: UploadExpenseReceiptInput): Promise<IExpense> {
    this.logger.log({ id: input.id, userId: input.userId }, "UploadExpenseReceiptUseCase.execute");

    const existing = await this.expenseRepository.findById(input.id, input.userId);
    if (!existing) throw new AppError("Resource not found", 404);

    const s3Key = await this.s3Service.upload(
      input.file.buffer,
      input.file.filename,
      input.file.mimetype,
      { userEmail: input.file.userEmail },
    );

    await this.expenseRepository.update(input.id, { receipt: s3Key });

    const signedUrl = await this.s3Service.getSignedUrl(s3Key);
    this.logger.log({ id: input.id }, "UploadExpenseReceiptUseCase.execute done");
    return { ...existing, receipt: signedUrl };
  }
}
