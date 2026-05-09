import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  getAllFixedExpenses,
  getFixedExpenseById,
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  getTotalFixedExpenses,
} from "../controllers/fixedExpense.controller";
import { SessionAuthGuard } from "./session-auth.guard";

@UseGuards(SessionAuthGuard)
@Controller("fixed-expenses")
export class FixedExpensesHttpController {
  @Get()
  async getAll(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    await getAllFixedExpenses(req, reply);
  }

  @Get("total")
  async getTotal(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    await getTotalFixedExpenses(req, reply);
  }

  @Get(":id")
  async getById(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await getFixedExpenseById(req, reply);
  }

  @Post()
  async create(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    await createFixedExpense(req, reply);
  }

  @Put(":id")
  async update(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await updateFixedExpense(req, reply);
  }

  @Delete(":id")
  async delete(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await deleteFixedExpense(req, reply);
  }
}
