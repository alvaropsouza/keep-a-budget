import fp from "fastify-plugin";
import cors from "@fastify/cors";

export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin: ["http://localhost:3000", "https://keep-a-budget.up.railway.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
});
