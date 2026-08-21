import { Injectable, Logger } from "@nestjs/common";
import { VehicleRepository } from "../../repositories/vehicle.repository";
import { VehicleRevisionRepository } from "../../repositories/vehicle-revision.repository";
import { S3Service } from "../../services/s3.service";
import { AppError } from "../../utils/app-error";
import type { IVehicleRevision } from "../../interfaces/vehicle-revision";

export type ListVehicleRevisionsInput = {
  vehicleId: string;
  userId: string;
};

@Injectable()
export class ListVehicleRevisionsUseCase {
  private readonly logger = new Logger(ListVehicleRevisionsUseCase.name);

  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly revisionRepository: VehicleRevisionRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: ListVehicleRevisionsInput): Promise<IVehicleRevision[]> {
    this.logger.log({ vehicleId: input.vehicleId, userId: input.userId }, "ListVehicleRevisionsUseCase.execute");

    const vehicle = await this.vehicleRepository.findById(input.vehicleId);
    if (!vehicle || vehicle.userId !== input.userId) throw new AppError("Resource not found", 404);

    const revisions = await this.revisionRepository.findMany(input.vehicleId);

    const withSignedUrls = await Promise.all(
      revisions.map(async (rev) => {
        const files = await Promise.all(rev.files.map((key) => this.s3Service.getSignedUrl(key)));
        return { ...rev, files };
      }),
    );

    this.logger.log({ vehicleId: input.vehicleId, count: revisions.length }, "ListVehicleRevisionsUseCase.execute done");
    return withSignedUrls;
  }
}
