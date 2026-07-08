import { Module } from "@nestjs/common";
import { PaymentMethodsController } from "./payment-methods.controller";
import { PaymentMethodRepository } from "../repositories/payment-method.repository";
import { ListPaymentMethodsUseCase } from "../use-cases/payment-methods/list-payment-methods.use-case";
import { CreatePaymentMethodUseCase } from "../use-cases/payment-methods/create-payment-method.use-case";
import { UpdatePaymentMethodUseCase } from "../use-cases/payment-methods/update-payment-method.use-case";
import { DeletePaymentMethodUseCase } from "../use-cases/payment-methods/delete-payment-method.use-case";
import { AuthModule } from "./auth.module";

@Module({
  imports: [AuthModule],
  controllers: [PaymentMethodsController],
  providers: [
    PaymentMethodRepository,
    ListPaymentMethodsUseCase,
    CreatePaymentMethodUseCase,
    UpdatePaymentMethodUseCase,
    DeletePaymentMethodUseCase,
  ],
  exports: [PaymentMethodRepository],
})
export class PaymentMethodsModule {}
