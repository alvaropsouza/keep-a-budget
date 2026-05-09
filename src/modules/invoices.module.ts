import { Module } from "@nestjs/common";
import { InvoiceService } from "../services/invoice.service";
import { InvoicesController } from "./invoices.controller";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [InvoicesController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoicesModule {}
