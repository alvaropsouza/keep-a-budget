import { Injectable, Logger } from "@nestjs/common";
import { VehicleRepository } from "../../repositories/vehicle.repository";
import { VehicleRevisionRepository } from "../../repositories/vehicle-revision.repository";
import { S3Service } from "../../services/s3.service";
import { AppError } from "../../utils/app-error";

export type DeleteVehicleRevisionInput = {
  id: string;
  vehicleId: string;
  userId: string;
};

@Injectable()
export class DeleteVehicleRevisionUseCase {
  private readonly logger = new Logger(DeleteVehicleRevisionUseCase.name);

  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly revisionRepository: VehicleRevisionRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: DeleteVehicleRevisionInput): Promise<void> {
    this.logger.log({ id: input.id, vehicleId: input.vehicleId, userId: input.userId }, "DeleteVehicleRevisionUseCase.execute");

    const vehicle = await this.vehicleRepository.findById(input.vehicleId);
    if (!vehicle || vehicle.userId !== input.userId) throw new AppError("Resource not found", 404);

    const revision = await this.revisionRepository.findById(input.id);
    if (!revision || revision.vehicleId !== input.vehicleId) throw new AppError("Resource not found", 404);

    await Promise.allSettled(revision.files.map((key) => this.s3Service.deleteObject(key)));

    await this.revisionRepository.delete(input.id);

    this.logger.log({ id: input.id }, "DeleteVehicleRevisionUseCase.execute done");
  }
}
