import { Module } from "@nestjs/common";
import { AuthModule } from "./auth.module";
import { IrDocumentController } from "./ir-documents.controller";
import { IrDocumentRepository } from "../repositories/ir-document.repository";
import { S3Service } from "../services/s3.service";
import { ListIrDocumentsUseCase } from "../use-cases/ir-documents/list-ir-documents.use-case";
import { CreateIrDocumentUseCase } from "../use-cases/ir-documents/create-ir-document.use-case";
import { DeleteIrDocumentUseCase } from "../use-cases/ir-documents/delete-ir-document.use-case";
import { GetIrDocumentsByYearUseCase } from "../use-cases/ir-documents/get-ir-documents-by-year.use-case";

@Module({
  imports: [AuthModule],
  controllers: [IrDocumentController],
  providers: [
    IrDocumentRepository,
    S3Service,
    ListIrDocumentsUseCase,
    CreateIrDocumentUseCase,
    DeleteIrDocumentUseCase,
    GetIrDocumentsByYearUseCase,
  ],
  exports: [GetIrDocumentsByYearUseCase],
})
export class IrDocumentModule {}
