import { FastifyRequest } from "fastify";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "kab_session";

const readCookieValue = (
  cookieHeader: string | undefined,
  cookieName: string,
): string | null => {
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(";").map((item) => item.trim());
  const target = parts.find((item) => item.startsWith(`${cookieName}=`));
  if (!target) {
    return null;
  }

  return decodeURIComponent(target.slice(cookieName.length + 1));
};

export const resolveSessionToken = (request: FastifyRequest): string | null => {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return readCookieValue(request.headers.cookie, SESSION_COOKIE_NAME);
};
