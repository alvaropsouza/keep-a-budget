import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Inject,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { FreelanceInvoiceService } from "../services/freelance-invoice.service";
import {
  CreateFreelanceInvoiceDto,
  UpdateFreelanceInvoiceDto,
} from "../dto/freelance-invoice.dto";
import { SessionAuthGuard } from "../modules/session-auth.guard";
import { AppError } from "../utils/AppError";

@Controller("freelance-invoices")
@UseGuards(SessionAuthGuard)
export class FreelanceInvoiceController {
  constructor(@Inject(FreelanceInvoiceService) private readonly invoiceService: FreelanceInvoiceService) {}

  @Post()
  async create(@Body() dto: CreateFreelanceInvoiceDto, @Request() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    return this.invoiceService.create(authUser.userId, dto);
  }

  @Get()
  async list(@Query("status") status?: string, @Request() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    return this.invoiceService.listByUser(authUser.userId, status);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @Request() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    return this.invoiceService.getById(id, authUser.userId);
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateFreelanceInvoiceDto, @Request() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    return this.invoiceService.update(id, authUser.userId, dto);
  }

  @Put(":id/status")
  async changeStatus(@Param("id") id: string, @Body("status") status: string, @Request() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    return this.invoiceService.changeStatus(id, authUser.userId, status);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string, @Request() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    return this.invoiceService.delete(id, authUser.userId);
  }
}
