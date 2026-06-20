import { Injectable, Logger } from "@nestjs/common";
import { VehicleRepository } from "../../repositories/vehicle.repository";
import { AppError } from "../../utils/app-error";

export type DeleteVehicleInput = { id: string; userId: string };

@Injectable()
export class DeleteVehicleUseCase {
  private readonly logger = new Logger(DeleteVehicleUseCase.name);

  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(input: DeleteVehicleInput): Promise<void> {
    this.logger.log({ input }, "DeleteVehicleUseCase.execute");

    const existing = await this.vehicleRepository.findById(input.id);
    if (!existing) throw new AppError("Vehicle not found", 404);
    if (existing.userId !== input.userId) throw new AppError("Unauthorized", 403);

    await this.vehicleRepository.delete(input.id);
    this.logger.log({ id: input.id }, "DeleteVehicleUseCase.execute done");
  }
}
