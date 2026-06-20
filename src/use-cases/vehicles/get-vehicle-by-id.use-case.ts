import { Injectable, Logger } from "@nestjs/common";
import { VehicleRepository } from "../../repositories/vehicle.repository";
import { AppError } from "../../utils/app-error";
import type { IVehicle } from "../../interfaces/vehicle";

export type GetVehicleByIdInput = { id: string; userId: string };

@Injectable()
export class GetVehicleByIdUseCase {
  private readonly logger = new Logger(GetVehicleByIdUseCase.name);

  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(input: GetVehicleByIdInput): Promise<IVehicle> {
    this.logger.log({ input }, "GetVehicleByIdUseCase.execute");

    const vehicle = await this.vehicleRepository.findById(input.id);
    if (!vehicle) throw new AppError("Vehicle not found", 404);
    if (vehicle.userId !== input.userId) throw new AppError("Unauthorized", 403);

    this.logger.log({ id: vehicle.id }, "GetVehicleByIdUseCase.execute done");
    return vehicle;
  }
}
