import fp from "fastify-plugin";
import { SessionRepository } from "../repositories/session.repository";
import { AuthenticateTokenUseCase } from "../use-cases/auth/authenticate-token.use-case";
import { AppError } from "../utils/app-error";
import { resolveSessionToken } from "../utils/session-token";
import type { AuthUser } from "../interfaces/auth";

const authenticateTokenUseCase = new AuthenticateTokenUseCase(new SessionRepository());

const authGuardPlugin = fp(async (app) => {
  app.decorateRequest("authUser", null);

  app.decorate("authenticate", async function authenticate(request) {
    const token = resolveSessionToken(request);
    if (!token) throw new AppError("Unauthorized", 401);

    const session = await authenticateTokenUseCase.execute({ token });
    request.authUser = session.user as AuthUser;
  });
});

export default authGuardPlugin;
