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
import { FinancialGoalService } from "../services/financial-goal.service";
import { CreateFinancialGoalDto, UpdateFinancialGoalDto } from "../dto/financial-goal.dto";
import { SessionAuthGuard } from "../modules/session-auth.guard";
import { AppError } from "../utils/AppError";

@Controller("financial-goals")
@UseGuards(SessionAuthGuard)
export class FinancialGoalController {
  constructor(
    @Inject(FinancialGoalService)
    private readonly goalService: FinancialGoalService,
  ) {}

  @Post()
  async create(@Body() dto: CreateFinancialGoalDto, @Request() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    return this.goalService.create(authUser.userId, dto);
  }

  @Get()
  async list(@Request() req: FastifyRequest, @Query("status") status?: string) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    return this.goalService.listByUser(authUser.userId, status);
  }

  @Get(":id")
  async getById(@Param("id") id: string, @Request() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    return this.goalService.getById(id, authUser.userId);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateFinancialGoalDto,
    @Request() req: FastifyRequest,
  ) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    return this.goalService.update(id, authUser.userId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string, @Request() req: FastifyRequest) {
    const authUser = req.authUser;
    if (!authUser) throw new AppError("Unauthorized", 401);
    await this.goalService.delete(id, authUser.userId);
  }
}
