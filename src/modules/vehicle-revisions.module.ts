import { Module } from "@nestjs/common";
import { VehicleRevisionsController } from "./vehicle-revisions.controller";
import { VehicleRepository } from "../repositories/vehicle.repository";
import { VehicleRevisionRepository } from "../repositories/vehicle-revision.repository";
import { S3Service } from "../services/s3.service";
import { CreateVehicleRevisionUseCase } from "../use-cases/vehicles/create-vehicle-revision.use-case";
import { ListVehicleRevisionsUseCase } from "../use-cases/vehicles/list-vehicle-revisions.use-case";
import { UpdateVehicleRevisionUseCase } from "../use-cases/vehicles/update-vehicle-revision.use-case";
import { AddRevisionFilesUseCase } from "../use-cases/vehicles/add-revision-files.use-case";
import { DeleteVehicleRevisionUseCase } from "../use-cases/vehicles/delete-vehicle-revision.use-case";
import { DeleteRevisionFileUseCase } from "../use-cases/vehicles/delete-revision-file.use-case";
import { GetRevisionFileUseCase } from "../use-cases/vehicles/get-revision-file.use-case";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [VehicleRevisionsController],
  providers: [
    VehicleRepository,
    VehicleRevisionRepository,
    S3Service,
    CreateVehicleRevisionUseCase,
    ListVehicleRevisionsUseCase,
    UpdateVehicleRevisionUseCase,
    AddRevisionFilesUseCase,
    DeleteVehicleRevisionUseCase,
    DeleteRevisionFileUseCase,
    GetRevisionFileUseCase,
  ],
})
export class VehicleRevisionsModule {}
