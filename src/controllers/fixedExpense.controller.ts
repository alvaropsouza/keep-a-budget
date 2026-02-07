import { FastifyRequest, FastifyReply } from "fastify";
import { BaseController } from "./base.controller";
import { FixedExpenseService } from "../services/fixedExpense.service";
import {
  CreateFixedExpenseDto,
  UpdateFixedExpenseDto,
  FixedExpenseQueryParamsDto,
} from "../dto/fixedExpense.dto";

export class FixedExpenseController extends BaseController {
  private service: FixedExpenseService;

  constructor() {
    super();
    this.service = new FixedExpenseService();
  }

  getAll = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const filter = this.service.buildFilter(
        "",
        request.query as FixedExpenseQueryParamsDto,
      );
      const fixedExpenses = await this.service.getAll("", filter);
      reply.send(fixedExpenses);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  getById = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const { id } = request.params as { id: string };
      const fixedExpense = await this.service.findById(id);
      reply.send(fixedExpense);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  create = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      if (!(await this.validate(CreateFixedExpenseDto, request.body, reply))) {
        return;
      }

      const fixedExpense = await this.service.createFixedExpense(
        "",
        request.body as any,
      );
      reply.status(201).send(fixedExpense);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  update = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      if (!(await this.validate(UpdateFixedExpenseDto, request.body, reply))) {
        return;
      }

      const { id } = request.params as { id: string };
      const fixedExpense = await this.service.updateFixedExpense(
        id,
        "",
        request.body as any,
      );
      reply.send(fixedExpense);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  delete = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const { id } = request.params as { id: string };
      await this.service.deleteFixedExpense(id, "");
      reply.send({ message: "Fixed expense deleted successfully" });
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  getTotalFixedExpenses = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const total = await this.service.getTotalFixedExpenses("");
      reply.send({ total });
    } catch (error) {
      this.handleError(error, reply);
    }
  };
}

const controller = new FixedExpenseController();

export const getAllFixedExpenses = controller.getAll;
export const getFixedExpenseById = controller.getById;
export const createFixedExpense = controller.create;
export const updateFixedExpense = controller.update;
export const deleteFixedExpense = controller.delete;
export const getTotalFixedExpenses = controller.getTotalFixedExpenses;
