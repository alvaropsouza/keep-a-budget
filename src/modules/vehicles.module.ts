import { Module } from "@nestjs/common";
import { VehiclesController } from "./vehicles.controller";
import { RemoveBgService } from "../services/remove-bg.service";
import { UploadCarPhotoUseCase } from "../use-cases/vehicles/upload-car-photo.use-case";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [VehiclesController],
  providers: [RemoveBgService, UploadCarPhotoUseCase],
})
export class VehiclesModule {}
