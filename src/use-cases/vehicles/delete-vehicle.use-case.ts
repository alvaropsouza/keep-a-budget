import { Injectable, Logger } from "@nestjs/common";
import { VehicleRepository } from "../../repositories/vehicle.repository";
import { VehicleRevisionRepository } from "../../repositories/vehicle-revision.repository";
import { S3Service } from "../../services/s3.service";
import { AppError } from "../../errors/app-error";

export type DeleteVehicleInput = { id: string; userId: string };

@Injectable()
export class DeleteVehicleUseCase {
  private readonly logger = new Logger(DeleteVehicleUseCase.name);

  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly revisionRepository: VehicleRevisionRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: DeleteVehicleInput): Promise<void> {
    this.logger.log({ input }, "DeleteVehicleUseCase.execute");

    const existing = await this.vehicleRepository.findById(input.id);
    if (!existing) throw new AppError("Vehicle not found", 404);
    if (existing.userId !== input.userId) throw new AppError("Unauthorized", 403);

    const revisions = await this.revisionRepository.findMany(input.id);
    const files = revisions.flatMap((revision) => revision.files);

    await this.vehicleRepository.delete(input.id);
    if (files.length > 0) await this.s3Service.deleteObjects(files);
    this.logger.log({ id: input.id }, "DeleteVehicleUseCase.execute done");
  }
}
