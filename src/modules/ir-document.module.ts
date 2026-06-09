import { Module } from "@nestjs/common";
import { AuthModule } from "./auth.module";
import { IrDocumentController } from "./ir-document.controller";
import { IrDocumentService } from "../services/ir-document.service";

@Module({
  imports: [AuthModule],
  controllers: [IrDocumentController],
  providers: [IrDocumentService],
  exports: [IrDocumentService],
})
export class IrDocumentModule {}
