import { Module } from "@nestjs/common";
import { VehiclesController } from "./vehicles.controller";
import { VehiclesService } from "../services/vehicles.service";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}
