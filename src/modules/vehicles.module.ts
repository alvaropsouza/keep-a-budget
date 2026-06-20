import { Module } from "@nestjs/common";
import { VehiclesController } from "./vehicles.controller";
import { RemoveBgService } from "../services/remove-bg.service";
import { VehicleRepository } from "../repositories/vehicle.repository";
import { UploadCarPhotoUseCase } from "../use-cases/vehicles/upload-car-photo.use-case";
import { ListVehiclesUseCase } from "../use-cases/vehicles/list-vehicles.use-case";
import { GetVehicleByIdUseCase } from "../use-cases/vehicles/get-vehicle-by-id.use-case";
import { CreateVehicleUseCase } from "../use-cases/vehicles/create-vehicle.use-case";
import { UpdateVehicleUseCase } from "../use-cases/vehicles/update-vehicle.use-case";
import { DeleteVehicleUseCase } from "../use-cases/vehicles/delete-vehicle.use-case";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [VehiclesController],
  providers: [
    RemoveBgService,
    VehicleRepository,
    UploadCarPhotoUseCase,
    ListVehiclesUseCase,
    GetVehicleByIdUseCase,
    CreateVehicleUseCase,
    UpdateVehicleUseCase,
    DeleteVehicleUseCase,
  ],
})
export class VehiclesModule {}
