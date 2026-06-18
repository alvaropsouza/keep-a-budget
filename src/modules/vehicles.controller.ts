import { Controller, Post, HttpCode, HttpStatus, UseGuards, Req, BadRequestException } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { VehiclesService } from "../services/vehicles.service";
import { SessionAuthGuard } from "./session-auth.guard";
import { validateUpload } from "../utils/validateUpload";
import { readMultipart } from "../utils/readMultipart";

@UseGuards(SessionAuthGuard)
@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post("car-photo")
  @HttpCode(HttpStatus.OK)
  async uploadCarPhoto(@Req() req: FastifyRequest) {
    const { file } = await readMultipart(req);
    if (!file) throw new BadRequestException("No file uploaded");

    const detectedMime = validateUpload(file.buffer, {
      allowed: ["image/jpeg", "image/png", "image/webp"],
      maxBytes: 5 * 1024 * 1024,
    });

    return this.vehiclesService.processUploadedPhoto(file.buffer, detectedMime);
  }
}
