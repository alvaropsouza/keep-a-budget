import { Injectable, Logger } from "@nestjs/common";
import { VehicleRepository } from "../../repositories/vehicle.repository";
import { VehicleRevisionRepository } from "../../repositories/vehicle-revision.repository";
import { S3Service } from "../../services/s3.service";
import { AppError } from "../../errors/app-error";
import { validateUpload, RECEIPT_UPLOAD_RULES, MAX_UPLOAD_FILES } from "../../utils/validate-upload";
import type { MultipartFile } from "../../utils/read-multipart";
import type { IVehicleRevision } from "../../interfaces/vehicle-revision";

export type AddRevisionFilesInput = {
  revisionId: string;
  vehicleId: string;
  userId: string;
  userEmail?: string;
  files: MultipartFile[];
};

@Injectable()
export class AddRevisionFilesUseCase {
  private readonly logger = new Logger(AddRevisionFilesUseCase.name);

  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly revisionRepository: VehicleRevisionRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: AddRevisionFilesInput): Promise<IVehicleRevision> {
    this.logger.log({ revisionId: input.revisionId, userId: input.userId, files: input.files.length }, "AddRevisionFilesUseCase.execute");

    const vehicle = await this.vehicleRepository.findById(input.vehicleId);
    if (!vehicle || vehicle.userId !== input.userId) throw new AppError("Resource not found", 404);

    const revision = await this.revisionRepository.findById(input.revisionId);
    if (!revision || revision.vehicleId !== input.vehicleId) throw new AppError("Resource not found", 404);

    if (input.files.length === 0) throw new AppError("Nenhum arquivo enviado.", 400);
    if (revision.files.length + input.files.length > MAX_UPLOAD_FILES)
      throw new AppError(`Máximo de ${MAX_UPLOAD_FILES} arquivos por revisão.`, 400);

    const validated = input.files.map((file) => ({ file, mimeType: validateUpload(file.buffer, RECEIPT_UPLOAD_RULES) }));

    const s3Keys: string[] = [];
    for (const { file, mimeType } of validated) {
      const key = await this.s3Service.upload(file.buffer, file.filename, mimeType, {
        keyPrefix: "vehicle-revisions",
        userEmail: input.userEmail,
      });
      s3Keys.push(key);
    }

    const updated = await this.revisionRepository.appendFiles(input.revisionId, s3Keys);
    this.logger.log({ revisionId: input.revisionId, files: s3Keys.length }, "AddRevisionFilesUseCase.execute done");
    return updated;
  }
}
