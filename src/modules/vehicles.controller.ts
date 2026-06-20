import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { ApiTags } from "@nestjs/swagger";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { AppError } from "../utils/app-error";
import { validateUpload } from "../utils/validate-upload";
import { readMultipart } from "../utils/read-multipart";
import { CreateVehicleDto, UpdateVehicleDto } from "../dto/vehicle.dto";
import { UploadCarPhotoUseCase } from "../use-cases/vehicles/upload-car-photo.use-case";
import { ListVehiclesUseCase } from "../use-cases/vehicles/list-vehicles.use-case";
import { GetVehicleByIdUseCase } from "../use-cases/vehicles/get-vehicle-by-id.use-case";
import { CreateVehicleUseCase } from "../use-cases/vehicles/create-vehicle.use-case";
import { UpdateVehicleUseCase } from "../use-cases/vehicles/update-vehicle.use-case";
import { DeleteVehicleUseCase } from "../use-cases/vehicles/delete-vehicle.use-case";

@ApiTags("vehicles")
@UseGuards(SessionAuthGuard)
@Controller("vehicles")
export class VehiclesController {
  constructor(
    private readonly uploadCarPhotoUseCase: UploadCarPhotoUseCase,
    private readonly listVehiclesUseCase: ListVehiclesUseCase,
    private readonly getVehicleByIdUseCase: GetVehicleByIdUseCase,
    private readonly createVehicleUseCase: CreateVehicleUseCase,
    private readonly updateVehicleUseCase: UpdateVehicleUseCase,
    private readonly deleteVehicleUseCase: DeleteVehicleUseCase,
  ) {}

  @Get()
  async getAll(@Req() req: FastifyRequest) {
    return this.listVehiclesUseCase.execute({ userId: this.authUserId(req) });
  }

  @Get(":id")
  async getById(@Param("id") id: string, @Req() req: FastifyRequest) {
    return this.getVehicleByIdUseCase.execute({ id, userId: this.authUserId(req) });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateVehicleDto, @Req() req: FastifyRequest) {
    return this.createVehicleUseCase.execute({ ...body, userId: this.authUserId(req) });
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: UpdateVehicleDto, @Req() req: FastifyRequest) {
    return this.updateVehicleUseCase.execute({ ...body, id, userId: this.authUserId(req) });
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: FastifyRequest) {
    await this.deleteVehicleUseCase.execute({ id, userId: this.authUserId(req) });
    return { message: "Vehicle deleted successfully" };
  }

  @Post("car-photo")
  @HttpCode(HttpStatus.OK)
  async uploadCarPhoto(@Req() req: FastifyRequest) {
    const { file } = await readMultipart(req);
    if (!file) throw new BadRequestException("No file uploaded");

    const detectedMime = validateUpload(file.buffer, {
      allowed: ["image/jpeg", "image/png", "image/webp"],
      maxBytes: 5 * 1024 * 1024,
    });

    return this.uploadCarPhotoUseCase.execute({ buffer: file.buffer, mimeType: detectedMime });
  }

  private authUserId(req: FastifyRequest): string {
    if (!req.authUser) throw new AppError("Unauthorized", 401);
    return req.authUser.userId;
  }
}
