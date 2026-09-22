import { Injectable, Logger } from "@nestjs/common";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { S3Service } from "../../services/s3.service";
import { GetIrDocumentsByYearUseCase } from "../ir-documents/get-ir-documents-by-year.use-case";
import { extractS3Key } from "../../utils/s3-upload";
import type { IExpense } from "../../interfaces/expense";
import type { IIrDocument } from "../../interfaces/ir-document";

export type ExportIrZipInput = { year: number; userId: string };

const CSV_FORMULA_TRIGGERS = ["=", "+", "-", "@", "\t", "\r"];

const sanitizeCsvField = (value: string): string =>
  CSV_FORMULA_TRIGGERS.some((trigger) => value.startsWith(trigger)) ? `'${value}` : value;

export const sanitizeFileSegment = (value: string): string =>
  value.replace(/[\\/:*?"<>|]/g, "-").trim() || "sem-categoria";

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
          const category = sanitizeFileSegment(e.category);
          return { buffer, filename: `despesas/${dateStr}-${category}-${e.id.slice(0, 8)}.${ext}`, sourceId: e.id };
        }),
    );

    const documentReceiptDownloads = await Promise.all(
      irDocuments.map(async (doc) => {
        const key = extractS3Key(doc.receipt);
        const buffer = await this.s3Service.downloadObject(key);
        const ext = key.split(".").pop() ?? "pdf";
        const dateStr = doc.date.toISOString().split("T")[0];
        const category = sanitizeFileSegment(doc.category);
        return { buffer, filename: `pix/${dateStr}-${category}-${doc.id.slice(0, 8)}.${ext}`, sourceId: doc.id };
      }),
    );

    const expenseReceiptById = new Map(expenseReceiptDownloads.map((r) => [r.sourceId, r]));
    const documentReceiptById = new Map(documentReceiptDownloads.map((r) => [r.sourceId, r]));
    const csvContent = this.buildCsv(
      input.year,
      expenses,
      irDocuments,
      expenseReceiptById,
      documentReceiptById,
    );

    const { ZipArchive } = await import("archiver");
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
    documentReceiptById: Map<string, { filename: string }>,
  ): string {
    const BOM = "﻿";
    const header = "Tipo,Data,Descrição,Categoria,Valor (R$),Arquivo do Recibo";

    const expenseRows = expenses.map((e) => {
      const date = e.date.toISOString().split("T")[0];
      const description = sanitizeCsvField((e.description ?? "").replace(/,/g, ";"));
      const category = sanitizeCsvField(e.category);
      const amount = e.amount.toFixed(2).replace(".", ",");
      const receiptFile = expenseReceiptById.get(e.id)?.filename ?? "Sem recibo";
      return `Despesa cartão,${date},${description},${category},${amount},${receiptFile}`;
    });

    const documentRows = irDocuments.map((doc) => {
      const date = doc.date.toISOString().split("T")[0];
      const description = sanitizeCsvField((doc.description ?? "").replace(/,/g, ";"));
      const category = sanitizeCsvField(doc.category);
      const amount = doc.amount.toFixed(2).replace(".", ",");
      const receiptFile = documentReceiptById.get(doc.id)?.filename ?? "Sem recibo";
      return `PIX/Débito,${date},${description},${category},${amount},${receiptFile}`;
    });

    return BOM + [header, ...expenseRows, ...documentRows].join("\n");
  }
}
