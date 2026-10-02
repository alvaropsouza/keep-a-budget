import { Controller, Get, Param, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { FastifyReply } from "fastify";
import { GetFileUseCase } from "../use-cases/files/get-file.use-case";

@ApiTags("files")
@Controller("files")
export class FilesController {
  constructor(private readonly getFileUseCase: GetFileUseCase) {}

  @Get(":token/:name")
  async get(@Param("token") token: string, @Res() reply: FastifyReply) {
    const { stream, contentType } = await this.getFileUseCase.execute({ token });

    void reply
      .header("Content-Type", contentType)
      .header("Content-Disposition", "inline")
      .header("Cache-Control", "private, max-age=3600")
      .header("Content-Security-Policy", "frame-ancestors 'self'")
      .send(stream);
  }
}
