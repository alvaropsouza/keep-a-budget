import { Module } from "@nestjs/common";
import { FreelanceInvoiceService } from "../services/freelance-invoice.service";
import { FreelanceInvoiceController } from "../controllers/freelance-invoice.controller";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [FreelanceInvoiceController],
  providers: [FreelanceInvoiceService],
  exports: [FreelanceInvoiceService],
})
export class FreelanceInvoiceModule {}
