import { Injectable, Logger } from "@nestjs/common";
import { VehicleRepository } from "../../repositories/vehicle.repository";
import type { IVehicle } from "../../interfaces/vehicle";
import type { CreateVehicleDto } from "../../dto/vehicle.dto";

export type CreateVehicleInput = CreateVehicleDto & { userId: string };

@Injectable()
export class CreateVehicleUseCase {
  private readonly logger = new Logger(CreateVehicleUseCase.name);

  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(input: CreateVehicleInput): Promise<IVehicle> {
    this.logger.log({ userId: input.userId, plate: input.plate }, "CreateVehicleUseCase.execute");

    const { userId, ...data } = input;
    const result = await this.vehicleRepository.create(userId, data);

    this.logger.log({ id: result.id }, "CreateVehicleUseCase.execute done");
    return result;
  }
}
