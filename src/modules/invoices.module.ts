import { Module } from "@nestjs/common";
import { InvoiceService } from "../services/invoice.service";
import { InvoicesHttpController } from "./invoices-http.controller";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [InvoicesHttpController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoicesModule {}
