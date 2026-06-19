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
import {
  CreateFixedExpenseDto,
  UpdateFixedExpenseDto,
  FixedExpenseQueryParamsDto,
} from "../dto/fixed-expense.dto";
import { ApiTags } from "@nestjs/swagger";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { AppError } from "../utils/app-error";
import { ListFixedExpensesUseCase } from "../use-cases/fixed-expenses/list-fixed-expenses.use-case";
import { GetFixedExpenseByIdUseCase } from "../use-cases/fixed-expenses/get-fixed-expense-by-id.use-case";
import { CreateFixedExpenseUseCase } from "../use-cases/fixed-expenses/create-fixed-expense.use-case";
import { UpdateFixedExpenseUseCase } from "../use-cases/fixed-expenses/update-fixed-expense.use-case";
import { DeleteFixedExpenseUseCase } from "../use-cases/fixed-expenses/delete-fixed-expense.use-case";
import { GetTotalFixedExpensesUseCase } from "../use-cases/fixed-expenses/get-total-fixed-expenses.use-case";

@ApiTags("fixed-expenses")
@UseGuards(SessionAuthGuard)
@Controller("fixed-expenses")
export class FixedExpensesController {
  constructor(
    private readonly listFixedExpensesUseCase: ListFixedExpensesUseCase,
    private readonly getFixedExpenseByIdUseCase: GetFixedExpenseByIdUseCase,
    private readonly createFixedExpenseUseCase: CreateFixedExpenseUseCase,
    private readonly updateFixedExpenseUseCase: UpdateFixedExpenseUseCase,
    private readonly deleteFixedExpenseUseCase: DeleteFixedExpenseUseCase,
    private readonly getTotalFixedExpensesUseCase: GetTotalFixedExpensesUseCase,
  ) {}

  @Get()
  async getAll(@Query() query: FixedExpenseQueryParamsDto, @Req() req: FastifyRequest) {
    return this.listFixedExpensesUseCase.execute({ userId: this.authUserId(req), query });
  }

  @Get("total")
  async getTotal(@Req() req: FastifyRequest) {
    const total = await this.getTotalFixedExpensesUseCase.execute({ userId: this.authUserId(req) });
    return { total };
  }

  @Get(":id")
  async getById(@Param("id") id: string, @Req() req: FastifyRequest) {
    return this.getFixedExpenseByIdUseCase.execute({ id, userId: this.authUserId(req) });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateFixedExpenseDto, @Req() req: FastifyRequest) {
    return this.createFixedExpenseUseCase.execute({ ...body, userId: this.authUserId(req) });
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: UpdateFixedExpenseDto, @Req() req: FastifyRequest) {
    return this.updateFixedExpenseUseCase.execute({ ...body, id, userId: this.authUserId(req) });
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: FastifyRequest) {
    await this.deleteFixedExpenseUseCase.execute({ id, userId: this.authUserId(req) });
    return { message: "Fixed expense deleted successfully" };
  }

  private authUserId(req: FastifyRequest): string {
    if (!req.authUser) throw new AppError("Unauthorized", 401);
    return req.authUser.userId;
  }
}
