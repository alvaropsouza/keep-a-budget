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
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  uploadReceipt,
  deleteReceipt,
} from "../controllers/expense.controller";
import { SessionAuthGuard } from "./session-auth.guard";

@UseGuards(SessionAuthGuard)
@Controller("expenses")
export class ExpensesHttpController {
  @Get()
  async getAll(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    await getAllExpenses(req, reply);
  }

  @Get(":id")
  async getById(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await getExpenseById(req, reply);
  }

  @Post()
  async create(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    await createExpense(req, reply);
  }

  @Put(":id")
  async update(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await updateExpense(req, reply);
  }

  @Delete(":id")
  async delete(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await deleteExpense(req, reply);
  }

  @Post(":id/receipt")
  async uploadReceipt(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await uploadReceipt(req, reply);
  }

  @Delete(":id/receipt")
  async deleteReceipt(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await deleteReceipt(req, reply);
  }
}
