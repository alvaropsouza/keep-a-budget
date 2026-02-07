import { FastifyReply, FastifyRequest } from "fastify";
import { BaseController } from "./base.controller";
import { UserService } from "../services/user.service";
import { CreateUserDto, UpdateUserDto } from "../dto/user.dto";

export class UserController extends BaseController {
  private service: UserService;

  constructor() {
    super();
    this.service = new UserService();
  }

  getAll = async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await this.service.getAll();
      reply.send(users);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const user = await this.service.findById(id);
      reply.send(user);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  getByEmail = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = request.params as { email: string };
      const user = await this.service.findByEmail(email, true);
      reply.send(user);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!(await this.validate(CreateUserDto, request.body, reply))) {
        return;
      }

      const user = await this.service.createUser(request.body as any);
      reply.status(201).send(user);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  update = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!(await this.validate(UpdateUserDto, request.body, reply))) {
        return;
      }

      const { id } = request.params as { id: string };
      const user = await this.service.update(id, request.body as any);
      reply.send(user);
    } catch (error) {
      this.handleError(error, reply);
    }
  };

  delete = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      await this.service.delete(id);
      reply.send({ message: "User deleted successfully" });
    } catch (error) {
      this.handleError(error, reply);
    }
  };
}

const userController = new UserController();
export const {
  getAll: getAllUsers,
  getById: getUserById,
  getByEmail: getUserByEmail,
  create: createUser,
  update: updateUser,
  delete: deleteUser,
} = userController;
