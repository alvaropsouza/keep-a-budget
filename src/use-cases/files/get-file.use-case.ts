import { Injectable, Logger } from "@nestjs/common";
import type { Readable } from "node:stream";
import { S3Service } from "../../services/s3.service";
import { AppError } from "../../errors/app-error";
import { readFileToken } from "../../utils/file-token";
import { contentTypeForKey } from "../../utils/s3-upload";

export type GetFileInput = {
  token: string;
};

export type GetFileOutput = {
  stream: Readable;
  contentType: string;
};

@Injectable()
export class GetFileUseCase {
  private readonly logger = new Logger(GetFileUseCase.name);

  constructor(private readonly s3Service: S3Service) {}

  async execute(input: GetFileInput): Promise<GetFileOutput> {
    const key = readFileToken(input.token);
    if (!key) throw new AppError("File not found", 404);

    const stream = await this.s3Service.openObjectStream(key);
    if (!stream) {
      this.logger.warn("GetFileUseCase.execute object missing");
      throw new AppError("File not found", 404);
    }

    return { stream, contentType: contentTypeForKey(key) };
  }
}
