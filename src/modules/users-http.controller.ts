import { Controller, Delete, Get, Param, Post, Put, Req, Res, UseGuards } from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  getAllUsers,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";
import { SessionAuthGuard } from "./session-auth.guard";

@Controller("users")
export class UsersHttpController {
  @UseGuards(SessionAuthGuard)
  @Get()
  async getAll(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    await getAllUsers(req, reply);
  }

  @UseGuards(SessionAuthGuard)
  @Get("by-email/:email")
  async getByEmail(
    @Param("email") _email: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await getUserByEmail(req, reply);
  }

  @UseGuards(SessionAuthGuard)
  @Get(":id")
  async getById(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await getUserById(req, reply);
  }

  @Post()
  async create(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    await createUser(req, reply);
  }

  @UseGuards(SessionAuthGuard)
  @Put(":id")
  async update(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await updateUser(req, reply);
  }

  @UseGuards(SessionAuthGuard)
  @Delete(":id")
  async delete(
    @Param("id") _id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await deleteUser(req, reply);
  }
}
