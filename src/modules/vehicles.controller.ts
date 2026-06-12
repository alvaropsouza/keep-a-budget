import { Controller, Post, HttpCode, HttpStatus, UseGuards, Req, BadRequestException } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { VehiclesService } from "../services/vehicles.service";
import { SessionAuthGuard } from "./session-auth.guard";

@UseGuards(SessionAuthGuard)
@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post("car-photo")
  @HttpCode(HttpStatus.OK)
  async uploadCarPhoto(@Req() req: FastifyRequest) {
    const parts = req.parts();
    let fileBuffer: Buffer | undefined;
    let fileMimetype: string | undefined;

    for await (const part of parts) {
      if (part.type === "file") {
        fileBuffer = await part.toBuffer();
        fileMimetype = part.mimetype;
        break;
      }
    }

    if (!fileBuffer || !fileMimetype) throw new BadRequestException("No file uploaded");
    return this.vehiclesService.processUploadedPhoto(fileBuffer, fileMimetype);
  }
}
