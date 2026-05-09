import { Controller, Get, Post, Req, Res } from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  login,
  authenticate,
  validateSession,
  me,
  logout,
} from "../controllers/auth.controller";

@Controller("auth")
export class AuthHttpController {
  @Post("login")
  async login(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    await login(req, reply);
  }

  @Post("authenticate")
  async authenticate(
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await authenticate(req, reply);
  }

  @Get("validate")
  async validate(
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await validateSession(req, reply);
  }

  @Get("me")
  async me(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    await me(req, reply);
  }

  @Post("logout")
  async logout(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    await logout(req, reply);
  }
}
