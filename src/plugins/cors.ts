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

      const fallback =
        process.env.NODE_ENV === "production"
          ? []
          : ["http://localhost:8080"];
      const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
        ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
        : fallback;

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
