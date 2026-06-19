import { Injectable, Logger } from "@nestjs/common";
import type { CarPhotoResponse } from "../../dto/car-image.dto";
import { RemoveBgService } from "../../services/remove-bg.service";

export type UploadCarPhotoInput = {
  buffer: Buffer;
  mimeType: string;
};

@Injectable()
export class UploadCarPhotoUseCase {
  private readonly logger = new Logger(UploadCarPhotoUseCase.name);

  constructor(private readonly removeBgService: RemoveBgService) {}

  async execute(input: UploadCarPhotoInput): Promise<CarPhotoResponse> {
    this.logger.log({ mimeType: input.mimeType }, "UploadCarPhotoUseCase.execute");

    const cleanUrl = await this.removeBgService.removeBackground(input.buffer, input.mimeType);

    this.logger.log({ hasResult: cleanUrl !== null }, "UploadCarPhotoUseCase.execute done");
    return { cleanUrl };
  }
}
