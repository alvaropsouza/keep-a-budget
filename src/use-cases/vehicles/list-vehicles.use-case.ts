import { Injectable, Logger } from "@nestjs/common";
import { VehicleRepository } from "../../repositories/vehicle.repository";
import type { IVehicle } from "../../interfaces/vehicle";

export type ListVehiclesInput = { userId: string };

@Injectable()
export class ListVehiclesUseCase {
  private readonly logger = new Logger(ListVehiclesUseCase.name);

  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(input: ListVehiclesInput): Promise<IVehicle[]> {
    this.logger.log({ userId: input.userId }, "ListVehiclesUseCase.execute");

    const result = await this.vehicleRepository.findMany(input.userId);

    this.logger.log({ count: result.length }, "ListVehiclesUseCase.execute done");
    return result;
  }
}
