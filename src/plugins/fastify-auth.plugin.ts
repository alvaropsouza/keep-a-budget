import fp from "fastify-plugin";
import { AuthService, AuthUser } from "../services/auth.service";
import { AppError } from "../utils/app-error";
import { resolveSessionToken } from "../utils/session-token";

const authService = new AuthService();

const authGuardPlugin = fp(async (app) => {
  app.decorateRequest("authUser", null);

  app.decorate("authenticate", async function authenticate(request) {
    const token = resolveSessionToken(request);
    if (!token) {
      throw new AppError("Unauthorized", 401);
    }

    const session = await authService.authenticateToken(token);
    request.authUser = session.user as AuthUser;
  });
});

export default authGuardPlugin;
