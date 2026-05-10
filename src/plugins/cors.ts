import fastifyCors, { FastifyCorsOptions } from "@fastify/cors";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

const corsPlugin = fp(async (app: FastifyInstance) => {
  const corsOptions: FastifyCorsOptions = {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }

      const isProd = process.env.NODE_ENV === "production";
      const extraOrigins = process.env.CORS_EXTRA_ORIGINS
        ? process.env.CORS_EXTRA_ORIGINS.split(",").map((o) => o.trim())
        : [];
      const allowedOrigins = isProd
        ? ["https://keep-a-budget.up.railway.app", ...extraOrigins]
        : ["http://localhost:8080", ...extraOrigins];

      cb(null, allowedOrigins.includes(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
  };

  await app.register(fastifyCors, corsOptions);
});

export default corsPlugin;
