import { Injectable, Logger } from "@nestjs/common";
import { ZipArchive } from "archiver";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { S3Service } from "../../services/s3.service";
import { GetIrDocumentsByYearUseCase } from "../ir-documents/get-ir-documents-by-year.use-case";
import { extractS3Key } from "../../utils/s3-upload";
import type { IExpense } from "../../interfaces/expense";
import type { IIrDocument } from "../../interfaces/ir-document";

export type ExportIrZipInput = { year: number; userId: string };

@Injectable()
export class ExportIrZipUseCase {
  private readonly logger = new Logger(ExportIrZipUseCase.name);

  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly s3Service: S3Service,
    private readonly getIrDocumentsByYearUseCase: GetIrDocumentsByYearUseCase,
  ) {}

  async execute(input: ExportIrZipInput): Promise<Buffer> {
    this.logger.log({ input }, "ExportIrZipUseCase.execute");

    const [expenses, irDocuments] = await Promise.all([
      this.expenseRepository.findIrExpenses(input.year, input.userId),
      this.getIrDocumentsByYearUseCase.execute({ userId: input.userId, year: input.year }),
    ]);

    const expenseReceiptDownloads = await Promise.all(
      expenses
        .filter((e) => e.receipt)
        .map(async (e) => {
          const key = extractS3Key(e.receipt!);
          const buffer = await this.s3Service.downloadObject(key);
          const ext = key.split(".").pop() ?? "jpg";
          const dateStr = e.date.toISOString().split("T")[0];
          return { buffer, filename: `despesas/${dateStr}-${e.category}-${e.id.slice(0, 8)}.${ext}`, sourceId: e.id };
        }),
    );

    const documentReceiptDownloads = await Promise.all(
      irDocuments.map(async (doc) => {
        const key = extractS3Key(doc.receipt);
        const buffer = await this.s3Service.downloadObject(key);
        const ext = key.split(".").pop() ?? "pdf";
        const dateStr = doc.date.toISOString().split("T")[0];
        return { buffer, filename: `pix/${dateStr}-${doc.category}-${doc.id.slice(0, 8)}.${ext}`, sourceId: doc.id };
      }),
    );

    const expenseReceiptById = new Map(expenseReceiptDownloads.map((r) => [r.sourceId, r]));
    const csvContent = this.buildCsv(input.year, expenses, irDocuments, expenseReceiptById);

    const result = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const archive = new ZipArchive({ zlib: { level: 6 } });
      archive.on("data", (chunk: Buffer) => chunks.push(chunk));
      archive.on("end", () => resolve(Buffer.concat(chunks)));
      archive.on("error", reject);
      archive.append(Buffer.from(csvContent, "utf-8"), { name: `resumo-ir-${input.year}.csv` });
      for (const { buffer, filename } of expenseReceiptDownloads) archive.append(buffer, { name: filename });
      for (const { buffer, filename } of documentReceiptDownloads) archive.append(buffer, { name: filename });
      archive.finalize();
    });

    this.logger.log({ year: input.year }, "ExportIrZipUseCase.execute done");
    return result;
  }

  private buildCsv(
    _year: number,
    expenses: IExpense[],
    irDocuments: IIrDocument[],
    expenseReceiptById: Map<string, { filename: string }>,
  ): string {
    const BOM = "﻿";
    const header = "Tipo,Data,Descrição,Categoria,Valor (R$),Arquivo do Recibo";

    const expenseRows = expenses.map((e) => {
      const date = e.date.toISOString().split("T")[0];
      const description = (e.description ?? "").replace(/,/g, ";");
      const amount = e.amount.toFixed(2).replace(".", ",");
      const receiptFile = expenseReceiptById.get(e.id)?.filename ?? "Sem recibo";
      return `Despesa cartão,${date},${description},${e.category},${amount},${receiptFile}`;
    });

    const documentRows = irDocuments.map((doc) => {
      const date = doc.date.toISOString().split("T")[0];
      const description = (doc.description ?? "").replace(/,/g, ";");
      const amount = doc.amount.toFixed(2).replace(".", ",");
      const receiptFile = `pix/${date}-${doc.category}-${doc.id.slice(0, 8)}`;
      return `PIX/Débito,${date},${description},${doc.category},${amount},${receiptFile}`;
    });

    return BOM + [header, ...expenseRows, ...documentRows].join("\n");
  }
}
