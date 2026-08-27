import { Injectable, Logger } from "@nestjs/common";
import { VehicleRepository } from "../../repositories/vehicle.repository";
import { VehicleRevisionRepository } from "../../repositories/vehicle-revision.repository";
import { S3Service } from "../../services/s3.service";
import { AppError } from "../../utils/app-error";
import { extractS3Key } from "../../utils/s3-upload";

export type GetRevisionFileInput = {
  vehicleId: string;
  revisionId: string;
  userId: string;
  fileRef: string;
};

export type GetRevisionFileOutput = {
  buffer: Buffer;
  contentType: string;
};

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

@Injectable()
export class GetRevisionFileUseCase {
  private readonly logger = new Logger(GetRevisionFileUseCase.name);

  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly revisionRepository: VehicleRevisionRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: GetRevisionFileInput): Promise<GetRevisionFileOutput> {
    this.logger.log({ revisionId: input.revisionId, userId: input.userId }, "GetRevisionFileUseCase.execute");

    const vehicle = await this.vehicleRepository.findById(input.vehicleId);
    if (!vehicle || vehicle.userId !== input.userId) throw new AppError("Resource not found", 404);

    const revision = await this.revisionRepository.findById(input.revisionId);
    if (!revision || revision.vehicleId !== input.vehicleId) throw new AppError("Resource not found", 404);

    const key = decodeURIComponent(extractS3Key(input.fileRef));
    if (!revision.files.includes(key)) throw new AppError("File not found", 404);

    const buffer = await this.s3Service.downloadObject(key);
    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

    this.logger.log({ revisionId: input.revisionId, key }, "GetRevisionFileUseCase.execute done");
    return { buffer, contentType };
  }
}
