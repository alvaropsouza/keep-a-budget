import "dotenv/config";
import validateEnv from "./config/validateEnv";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import connectDB from "./config/database";
import invoiceRoutes from "./routes/invoices";
import expenseRoutes from "./routes/expenses";
import logger, { fastifyLoggerConfig } from "./config/logger";

validateEnv();

const app = Fastify({ logger: fastifyLoggerConfig });

app.register(rateLimit, {
  max: 100, // Maximum 100 requests
  timeWindow: "1 minute", // Per minute
});

app.register(multipart);

app.register(invoiceRoutes, { prefix: "/api/invoices" });
app.register(expenseRoutes, { prefix: "/api/expenses" });

app.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

const start = async (): Promise<void> => {
  try {
    await connectDB();

    const port = Number.parseInt(process.env.PORT || "3000");
    const host = process.env.HOST || "0.0.0.0";

    await app.listen({ port, host });
    logger.info(`Server is running on http://${host}:${port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();

export default app;
