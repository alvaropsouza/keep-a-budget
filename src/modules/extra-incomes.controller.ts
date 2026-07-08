import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { ApiTags } from "@nestjs/swagger";
import { CreateExtraIncomeDto, ExtraIncomeQueryParamsDto } from "../dto/extra-income.dto";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { AppError } from "../utils/app-error";
import { ListExtraIncomesUseCase } from "../use-cases/extra-incomes/list-extra-incomes.use-case";
import { CreateExtraIncomeUseCase } from "../use-cases/extra-incomes/create-extra-income.use-case";
import { DeleteExtraIncomeUseCase } from "../use-cases/extra-incomes/delete-extra-income.use-case";

@ApiTags("extra-incomes")
@UseGuards(SessionAuthGuard)
@Controller("extra-incomes")
export class ExtraIncomesController {
  constructor(
    private readonly listExtraIncomesUseCase: ListExtraIncomesUseCase,
    private readonly createExtraIncomeUseCase: CreateExtraIncomeUseCase,
    private readonly deleteExtraIncomeUseCase: DeleteExtraIncomeUseCase,
  ) {}

  @Get()
  async getAll(@Query() query: ExtraIncomeQueryParamsDto, @Req() req: FastifyRequest) {
    return this.listExtraIncomesUseCase.execute({ userId: this.authUserId(req), query });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateExtraIncomeDto, @Req() req: FastifyRequest) {
    return this.createExtraIncomeUseCase.execute({ ...body, userId: this.authUserId(req) });
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: FastifyRequest) {
    await this.deleteExtraIncomeUseCase.execute({ id, userId: this.authUserId(req) });
    return { message: "Extra income deleted successfully" };
  }

  private authUserId(req: FastifyRequest): string {
    if (!req.authUser) throw new AppError("Unauthorized", 401);
    return req.authUser.userId;
  }
}
