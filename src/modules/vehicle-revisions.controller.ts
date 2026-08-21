import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
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
import { readMultipartFiles } from "../utils/read-multipart";
import { CreateVehicleRevisionUseCase } from "../use-cases/vehicles/create-vehicle-revision.use-case";
import { ListVehicleRevisionsUseCase } from "../use-cases/vehicles/list-vehicle-revisions.use-case";
import { DeleteVehicleRevisionUseCase } from "../use-cases/vehicles/delete-vehicle-revision.use-case";
import { DeleteRevisionFileUseCase } from "../use-cases/vehicles/delete-revision-file.use-case";
import { CreateVehicleRevisionDto } from "../dto/vehicle-revision.dto";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

@ApiTags("vehicle-revisions")
@UseGuards(SessionAuthGuard)
@Controller("vehicles/:vehicleId/revisions")
export class VehicleRevisionsController {
  constructor(
    private readonly createVehicleRevisionUseCase: CreateVehicleRevisionUseCase,
    private readonly listVehicleRevisionsUseCase: ListVehicleRevisionsUseCase,
    private readonly deleteVehicleRevisionUseCase: DeleteVehicleRevisionUseCase,
    private readonly deleteRevisionFileUseCase: DeleteRevisionFileUseCase,
  ) {}

  @Get()
  async list(@Param("vehicleId") vehicleId: string, @Req() req: FastifyRequest) {
    return this.listVehicleRevisionsUseCase.execute({ vehicleId, userId: this.authUserId(req) });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Param("vehicleId") vehicleId: string, @Req() req: FastifyRequest) {
    const { fields, files } = await readMultipartFiles(req);

    const dto = plainToInstance(CreateVehicleRevisionDto, fields);
    const errors = await validate(dto);
    if (errors.length > 0) {
      const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
      throw new BadRequestException(messages.join(", "));
    }

    const user = req.authUser;
    if (!user) throw new AppError("Unauthorized", 401);

    return this.createVehicleRevisionUseCase.execute({
      vehicleId,
      userId: user.userId,
      userEmail: user.email,
      data: dto,
      files,
    });
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRevision(
    @Param("vehicleId") vehicleId: string,
    @Param("id") id: string,
    @Req() req: FastifyRequest,
  ) {
    await this.deleteVehicleRevisionUseCase.execute({ id, vehicleId, userId: this.authUserId(req) });
  }

  @Delete(":id/files/:encodedKey")
  async deleteFile(
    @Param("vehicleId") vehicleId: string,
    @Param("id") id: string,
    @Param("encodedKey") encodedKey: string,
    @Req() req: FastifyRequest,
  ) {
    const s3Key = decodeURIComponent(encodedKey);
    return this.deleteRevisionFileUseCase.execute({
      revisionId: id,
      vehicleId,
      userId: this.authUserId(req),
      s3Key,
    });
  }

  private authUserId(req: FastifyRequest): string {
    if (!req.authUser) throw new AppError("Unauthorized", 401);
    return req.authUser.userId;
  }
}
