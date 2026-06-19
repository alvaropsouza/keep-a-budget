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
import { BudgetService } from "../services/budget.service";
import { UpsertBudgetDto, BudgetQueryDto } from "../dto/budget.dto";
import { ApiTags } from "@nestjs/swagger";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { AppError } from "../utils/app-error";

@ApiTags("budgets")
@UseGuards(SessionAuthGuard)
@Controller("budgets")
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  async list(@Query() query: BudgetQueryDto, @Req() req: FastifyRequest) {
    const { userId } = this.getAuthUser(req);
    return this.budgetService.list(userId, Number(query.month), Number(query.year));
  }

  @Get("summary")
  async summary(@Query() query: BudgetQueryDto, @Req() req: FastifyRequest) {
    const { userId } = this.getAuthUser(req);
    return this.budgetService.getSummary(userId, Number(query.month), Number(query.year));
  }

  @Get("expenses")
  async expenses(
    @Query() query: BudgetQueryDto & { category: string },
    @Req() req: FastifyRequest,
  ) {
    const { userId } = this.getAuthUser(req);
    return this.budgetService.getExpenses(userId, query.category, Number(query.month), Number(query.year));
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async upsert(@Body() body: UpsertBudgetDto, @Req() req: FastifyRequest) {
    const { userId } = this.getAuthUser(req);
    return this.budgetService.upsert(
      userId,
      body.category,
      body.amount,
      body.month,
      body.year,
      body.invoiceIds,
    );
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Req() req: FastifyRequest) {
    const { userId } = this.getAuthUser(req);
    await this.budgetService.delete(id, userId);
    return { message: "Budget deleted" };
  }

  private getAuthUser(req: FastifyRequest) {
    if (!req.authUser) throw new AppError("Unauthorized", 401);
    return req.authUser;
  }
}
