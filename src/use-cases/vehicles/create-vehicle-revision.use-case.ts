import { Injectable, Logger } from "@nestjs/common";
import { VehicleRepository } from "../../repositories/vehicle.repository";
import { VehicleRevisionRepository } from "../../repositories/vehicle-revision.repository";
import { S3Service } from "../../services/s3.service";
import { AppError } from "../../utils/app-error";
import { validateUpload, RECEIPT_UPLOAD_RULES } from "../../utils/validate-upload";
import type { CreateVehicleRevisionDto } from "../../dto/vehicle-revision.dto";
import type { MultipartFile } from "../../utils/read-multipart";
import type { IVehicleRevision } from "../../interfaces/vehicle-revision";

export type CreateVehicleRevisionInput = {
  vehicleId: string;
  userId: string;
  userEmail?: string;
  data: CreateVehicleRevisionDto;
  files: MultipartFile[];
};

@Injectable()
export class CreateVehicleRevisionUseCase {
  private readonly logger = new Logger(CreateVehicleRevisionUseCase.name);

  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly revisionRepository: VehicleRevisionRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: CreateVehicleRevisionInput): Promise<IVehicleRevision> {
    this.logger.log({ vehicleId: input.vehicleId, userId: input.userId }, "CreateVehicleRevisionUseCase.execute");

    const vehicle = await this.vehicleRepository.findById(input.vehicleId);
    if (!vehicle || vehicle.userId !== input.userId) throw new AppError("Resource not found", 404);

    if (input.files.length > 10) throw new AppError("Máximo de 10 arquivos por revisão.", 400);

    const revision = await this.revisionRepository.create(input.vehicleId, input.data);

    if (input.files.length > 0) {
      const s3Keys: string[] = [];
      for (const file of input.files) {
        const mimeType = validateUpload(file.buffer, RECEIPT_UPLOAD_RULES);
        const key = await this.s3Service.upload(file.buffer, file.filename, mimeType, {
          keyPrefix: "vehicle-revisions",
          userEmail: input.userEmail,
        });
        s3Keys.push(key);
      }
      const updated = await this.revisionRepository.appendFiles(revision.id, s3Keys);
      this.logger.log({ id: revision.id, files: s3Keys.length }, "CreateVehicleRevisionUseCase.execute done");
      return updated;
    }

    this.logger.log({ id: revision.id }, "CreateVehicleRevisionUseCase.execute done");
    return revision;
  }
}
