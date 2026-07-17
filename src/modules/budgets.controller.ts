import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { UpsertBudgetDto, BudgetQueryDto } from "../dto/budget.dto";
import { ApiTags } from "@nestjs/swagger";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { AppError } from "../utils/app-error";
import { ListBudgetsUseCase } from "../use-cases/budgets/list-budgets.use-case";
import { GetBudgetSummaryUseCase } from "../use-cases/budgets/get-budget-summary.use-case";
import { GetActiveBudgetSummaryUseCase } from "../use-cases/budgets/get-active-budget-summary.use-case";
import { GetBudgetExpensesUseCase } from "../use-cases/budgets/get-budget-expenses.use-case";
import { UpsertBudgetUseCase } from "../use-cases/budgets/upsert-budget.use-case";
import { DeleteBudgetUseCase } from "../use-cases/budgets/delete-budget.use-case";

@ApiTags("budgets")
@UseGuards(SessionAuthGuard)
@Controller("budgets")
export class BudgetController {
  constructor(
    private readonly listBudgetsUseCase: ListBudgetsUseCase,
    private readonly getBudgetSummaryUseCase: GetBudgetSummaryUseCase,
    private readonly getActiveBudgetSummaryUseCase: GetActiveBudgetSummaryUseCase,
    private readonly getBudgetExpensesUseCase: GetBudgetExpensesUseCase,
    private readonly upsertBudgetUseCase: UpsertBudgetUseCase,
    private readonly deleteBudgetUseCase: DeleteBudgetUseCase,
  ) {}

  @Get()
  async list(@Query() query: BudgetQueryDto, @Req() req: FastifyRequest) {
    return this.listBudgetsUseCase.execute({
      userId: this.authUserId(req),
      month: Number(query.month),
      year: Number(query.year),
    });
  }

  @Get("summary")
  async summary(@Query() query: BudgetQueryDto, @Req() req: FastifyRequest) {
    return this.getBudgetSummaryUseCase.execute({
      userId: this.authUserId(req),
      month: Number(query.month),
      year: Number(query.year),
    });
  }

  @Get("summary/active")
  async activeSummary(@Req() req: FastifyRequest) {
    return this.getActiveBudgetSummaryUseCase.execute({ userId: this.authUserId(req) });
  }

  @Get("expenses")
  async expenses(@Query() query: BudgetQueryDto & { category: string }, @Req() req: FastifyRequest) {
    return this.getBudgetExpensesUseCase.execute({
      userId: this.authUserId(req),
      category: query.category,
      month: Number(query.month),
      year: Number(query.year),
    });
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async upsert(@Body() body: UpsertBudgetDto, @Req() req: FastifyRequest) {
    return this.upsertBudgetUseCase.execute({ ...body, userId: this.authUserId(req) });
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Req() req: FastifyRequest) {
    await this.deleteBudgetUseCase.execute({ id, userId: this.authUserId(req) });
    return { message: "Budget deleted" };
  }

  private authUserId(req: FastifyRequest): string {
    if (!req.authUser) throw new AppError("Unauthorized", 401);
    return req.authUser.userId;
  }
}
