import fastifyCors, { FastifyCorsOptions } from "@fastify/cors";
import fp from "fastify-plugin";

const corsPlugin = fp(async (app) => {
  const corsOptions: FastifyCorsOptions = {
    origin: (origin, cb) => {
      const isProd = process.env.NODE_ENV === "production";

      if (!origin) {
        cb(null, !isProd);
        return;
      }

      const fallback = isProd ? [] : ["http://localhost:8080"];
      const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
        ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
        : fallback;

      cb(null, allowedOrigins.includes(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization", "X-Device-Id"],
    exposedHeaders: ["Content-Disposition"],
  };

  await app.register(fastifyCors, corsOptions);
});

export default corsPlugin;
