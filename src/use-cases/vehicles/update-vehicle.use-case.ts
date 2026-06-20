import { Injectable, Logger } from "@nestjs/common";
import { VehicleRepository } from "../../repositories/vehicle.repository";
import { AppError } from "../../utils/app-error";
import type { IVehicle } from "../../interfaces/vehicle";
import type { UpdateVehicleDto } from "../../dto/vehicle.dto";

export type UpdateVehicleInput = UpdateVehicleDto & { id: string; userId: string };

@Injectable()
export class UpdateVehicleUseCase {
  private readonly logger = new Logger(UpdateVehicleUseCase.name);

  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(input: UpdateVehicleInput): Promise<IVehicle> {
    this.logger.log({ input }, "UpdateVehicleUseCase.execute");

    const existing = await this.vehicleRepository.findById(input.id);
    if (!existing) throw new AppError("Vehicle not found", 404);
    if (existing.userId !== input.userId) throw new AppError("Unauthorized", 403);

    const { id, userId, ...data } = input;
    const result = await this.vehicleRepository.update(id, data);
    if (!result) throw new AppError("Vehicle not found", 404);

    this.logger.log({ id: result.id }, "UpdateVehicleUseCase.execute done");
    return result;
  }
}
