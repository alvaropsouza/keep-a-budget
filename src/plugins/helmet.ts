import helmet from "@fastify/helmet";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

const helmetPlugin = fp(async (app: FastifyInstance) => {
  const isProd = process.env.NODE_ENV === "production";

  const cspDirectives = {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'", "data:"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    imgSrc: ["'self'", "data:", "blob:"],
    objectSrc: ["'none'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  };

  await app.register(helmet, {
    contentSecurityPolicy: isProd
      ? {
          directives: cspDirectives,
        }
      : false,
    hsts: isProd
      ? {
          maxAge: 15552000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
    referrerPolicy: {
      policy: "no-referrer",
    },
    crossOriginResourcePolicy: {
      policy: "same-site",
    },
  });

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=()",
    );
    return payload;
  });
});

export default helmetPlugin;
