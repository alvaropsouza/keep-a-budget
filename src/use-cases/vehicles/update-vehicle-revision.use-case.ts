import { Injectable, Logger } from "@nestjs/common";
import { VehicleRepository } from "../../repositories/vehicle.repository";
import { VehicleRevisionRepository } from "../../repositories/vehicle-revision.repository";
import { AppError } from "../../errors/app-error";
import type { UpdateVehicleRevisionDto } from "../../dto/vehicle-revision.dto";
import type { IVehicleRevision } from "../../interfaces/vehicle-revision";

export type UpdateVehicleRevisionInput = {
  id: string;
  vehicleId: string;
  userId: string;
  data: UpdateVehicleRevisionDto;
};

@Injectable()
export class UpdateVehicleRevisionUseCase {
  private readonly logger = new Logger(UpdateVehicleRevisionUseCase.name);

  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly revisionRepository: VehicleRevisionRepository,
  ) {}

  async execute(input: UpdateVehicleRevisionInput): Promise<IVehicleRevision> {
    this.logger.log({ id: input.id, vehicleId: input.vehicleId, userId: input.userId }, "UpdateVehicleRevisionUseCase.execute");

    const vehicle = await this.vehicleRepository.findById(input.vehicleId);
    if (!vehicle || vehicle.userId !== input.userId) throw new AppError("Resource not found", 404);

    const revision = await this.revisionRepository.findById(input.id);
    if (!revision || revision.vehicleId !== input.vehicleId) throw new AppError("Resource not found", 404);

    const updated = await this.revisionRepository.update(input.id, input.data);

    this.logger.log({ id: input.id }, "UpdateVehicleRevisionUseCase.execute done");
    return updated;
  }
}
