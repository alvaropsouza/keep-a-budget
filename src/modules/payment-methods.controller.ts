import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { ApiTags } from "@nestjs/swagger";
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
  PaymentMethodQueryParamsDto,
} from "../dto/payment-method.dto";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { AppError } from "../utils/app-error";
import { ListPaymentMethodsUseCase } from "../use-cases/payment-methods/list-payment-methods.use-case";
import { CreatePaymentMethodUseCase } from "../use-cases/payment-methods/create-payment-method.use-case";
import { UpdatePaymentMethodUseCase } from "../use-cases/payment-methods/update-payment-method.use-case";
import { DeletePaymentMethodUseCase } from "../use-cases/payment-methods/delete-payment-method.use-case";

@ApiTags("payment-methods")
@UseGuards(SessionAuthGuard)
@Controller("payment-methods")
export class PaymentMethodsController {
  constructor(
    private readonly listPaymentMethodsUseCase: ListPaymentMethodsUseCase,
    private readonly createPaymentMethodUseCase: CreatePaymentMethodUseCase,
    private readonly updatePaymentMethodUseCase: UpdatePaymentMethodUseCase,
    private readonly deletePaymentMethodUseCase: DeletePaymentMethodUseCase,
  ) {}

  @Get()
  async getAll(@Query() query: PaymentMethodQueryParamsDto, @Req() req: FastifyRequest) {
    return this.listPaymentMethodsUseCase.execute({ userId: this.authUserId(req), query });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreatePaymentMethodDto, @Req() req: FastifyRequest) {
    return this.createPaymentMethodUseCase.execute({ ...body, userId: this.authUserId(req) });
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: UpdatePaymentMethodDto, @Req() req: FastifyRequest) {
    return this.updatePaymentMethodUseCase.execute({ ...body, id, userId: this.authUserId(req) });
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: FastifyRequest) {
    await this.deletePaymentMethodUseCase.execute({ id, userId: this.authUserId(req) });
    return { message: "Payment method deleted successfully" };
  }

  private authUserId(req: FastifyRequest): string {
    if (!req.authUser) throw new AppError("Unauthorized", 401);
    return req.authUser.userId;
  }
}
