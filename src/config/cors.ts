import fp from "fastify-plugin";
import cors from "@fastify/cors";
import "dotenv/config";

const DEFAULT_ALLOWED_ORIGINS: [] = [];

const envOrigins = process.env.ALLOWED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins =
  envOrigins && envOrigins.length > 0 ? envOrigins : DEFAULT_ALLOWED_ORIGINS;

export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
});
