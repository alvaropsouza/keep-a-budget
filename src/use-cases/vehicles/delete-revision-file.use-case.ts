import { Injectable, Logger } from "@nestjs/common";
import { VehicleRepository } from "../../repositories/vehicle.repository";
import { VehicleRevisionRepository } from "../../repositories/vehicle-revision.repository";
import { S3Service } from "../../services/s3.service";
import { AppError } from "../../utils/app-error";
import type { IVehicleRevision } from "../../interfaces/vehicle-revision";

export type DeleteRevisionFileInput = {
  revisionId: string;
  vehicleId: string;
  userId: string;
  s3Key: string;
};

@Injectable()
export class DeleteRevisionFileUseCase {
  private readonly logger = new Logger(DeleteRevisionFileUseCase.name);

  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly revisionRepository: VehicleRevisionRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: DeleteRevisionFileInput): Promise<IVehicleRevision> {
    this.logger.log({ revisionId: input.revisionId, userId: input.userId }, "DeleteRevisionFileUseCase.execute");

    const vehicle = await this.vehicleRepository.findById(input.vehicleId);
    if (!vehicle || vehicle.userId !== input.userId) throw new AppError("Resource not found", 404);

    const revision = await this.revisionRepository.findById(input.revisionId);
    if (!revision || revision.vehicleId !== input.vehicleId) throw new AppError("Resource not found", 404);

    if (!revision.files.includes(input.s3Key)) throw new AppError("File not found", 404);

    await this.s3Service.deleteObject(input.s3Key);
    const updated = await this.revisionRepository.removeFile(input.revisionId, input.s3Key);

    this.logger.log({ revisionId: input.revisionId }, "DeleteRevisionFileUseCase.execute done");
    return updated;
  }
}
