import { Controller, Post, HttpCode, HttpStatus, UseGuards, Req, BadRequestException } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { UploadCarPhotoUseCase } from "../use-cases/vehicles/upload-car-photo.use-case";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { ApiTags } from "@nestjs/swagger";
import { validateUpload } from "../utils/validate-upload";
import { readMultipart } from "../utils/read-multipart";

@ApiTags("vehicles")
@UseGuards(SessionAuthGuard)
@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly uploadCarPhotoUseCase: UploadCarPhotoUseCase) {}

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
}
