import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client/client";
import { uploadToS3, getSignedS3Url, extractS3Key } from "../utils/s3-upload";
import { getS3UrlConfig } from "../utils/s3-url";
import s3Client from "../config/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import logger from "../config/logger";
import { AppError } from "../utils/app-error";
import { prisma } from "../lib/prisma";

export interface IIrDocument {
  id: string;
  userId: string;
  date: Date;
  category: string;
  amount: number;
  description?: string;
  receipt: string;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateIrDocumentData {
  userId: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
  userEmail?: string;
}

interface FileData {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

const toNumber = (value: unknown): number =>
  value == null ? 0 : Number(value);

const mapDocument = (row: Prisma.IrDocumentGetPayload<true>): IIrDocument => ({
  id: row.id,
  userId: row.userId,
  date: new Date(row.date),
  category: row.category,
  amount: toNumber(row.amount),
  description: row.description ?? undefined,
  receipt: row.receipt,
  year: row.year,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

@Injectable()
export class IrDocumentService {
  async listByYear(year: number, userId: string): Promise<IIrDocument[]> {
    const rows = await prisma.irDocument.findMany({
      where: { userId, year },
      orderBy: [{ category: "asc" }, { date: "asc" }],
    });
    return rows.map(mapDocument);
  }

  async create(
    data: CreateIrDocumentData,
    file: FileData,
  ): Promise<IIrDocument> {
    const s3Key = await uploadToS3(file.buffer, file.filename, file.mimetype, {
      keyPrefix: "ir-documents",
      userEmail: data.userEmail,
    });

    const date = new Date(data.date);
    const year = date.getUTCFullYear();

    const row = await prisma.irDocument.create({
      data: {
        userId: data.userId,
        date,
        category: data.category,
        amount: data.amount,
        description: data.description ?? null,
        receipt: s3Key,
        year,
      },
    });

    logger.info({ irDocumentId: row.id, year }, "IR document created");
    return mapDocument(row);
  }

  async delete(id: string, userId: string): Promise<void> {
    const row = await prisma.irDocument.findUnique({ where: { id } });
    if (!row) throw new AppError("Documento não encontrado", 404);
    if (row.userId !== userId) throw new AppError("Sem permissão", 403);

    await this.deleteS3Object(row.receipt);
    await prisma.irDocument.delete({ where: { id } });

    logger.info({ irDocumentId: id }, "IR document deleted");
  }

  async getSignedDocuments(year: number, userId: string): Promise<IIrDocument[]> {
    const documents = await this.listByYear(year, userId);

    return Promise.all(
      documents.map(async (doc) => {
        try {
          const signedUrl = await getSignedS3Url(doc.receipt);
          return { ...doc, receipt: signedUrl };
        } catch {
          logger.error({ irDocumentId: doc.id }, "Failed to sign IR document URL");
          return doc;
        }
      }),
    );
  }

  private async deleteS3Object(keyOrUrl: string): Promise<void> {
    try {
      const config = getS3UrlConfig();
      const key = extractS3Key(keyOrUrl);
      await s3Client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    } catch (error) {
      logger.warn({ keyOrUrl, error }, "Failed to delete IR document from S3");
    }
  }
}
