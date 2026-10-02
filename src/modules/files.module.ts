import { Module } from "@nestjs/common";
import { FilesController } from "./files.controller";
import { S3Service } from "../services/s3.service";
import { GetFileUseCase } from "../use-cases/files/get-file.use-case";

@Module({
  controllers: [FilesController],
  providers: [S3Service, GetFileUseCase],
})
export class FilesModule {}
