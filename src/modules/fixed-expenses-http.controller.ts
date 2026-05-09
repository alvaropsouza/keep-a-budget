import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { FixedExpenseService } from "../services/fixedExpense.service";
import {
  CreateFixedExpenseDto,
  UpdateFixedExpenseDto,
  FixedExpenseQueryParamsDto,
} from "../dto/fixedExpense.dto";
import { SessionAuthGuard } from "./session-auth.guard";
import { AppError } from "../utils/AppError";

@UseGuards(SessionAuthGuard)
@Controller("fixed-expenses")
export class FixedExpensesHttpController {
  constructor(private readonly fixedExpenseService: FixedExpenseService) {}

  @Get()
  async getAll(@Query() query: FixedExpenseQueryParamsDto, @Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    const filter = this.fixedExpenseService.buildFilter(authUser.userId, query);
    return this.fixedExpenseService.getAll(authUser.userId, filter);
  }

  @Get("total")
  async getTotal(@Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    const total = await this.fixedExpenseService.getTotalFixedExpenses(authUser.userId);
    return { total };
  }

  @Get(":id")
  async getById(@Param("id") id: string, @Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    const fixedExpense = await this.fixedExpenseService.findById(id);
    if (fixedExpense.userId !== authUser.userId) {
      throw new AppError("Unauthorized to access this fixed expense", 403);
    }
    return fixedExpense;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateFixedExpenseDto, @Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    return this.fixedExpenseService.createFixedExpense(authUser.userId, body);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() body: UpdateFixedExpenseDto,
    @Req() req: FastifyRequest,
  ) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    return this.fixedExpenseService.updateFixedExpense(id, authUser.userId, body);
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    await this.fixedExpenseService.deleteFixedExpense(id, authUser.userId);
    return { message: "Fixed expense deleted successfully" };
  }
}
