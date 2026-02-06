import "dotenv/config";
import validateEnv from "./config/validateEnv";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import connectDB from "./config/database";
import invoiceRoutes from "./routes/invoices";
import expenseRoutes from "./routes/expenses";
import logger, { fastifyLoggerConfig } from "./config/logger";
import { errorHandler } from "./config/errorHandler";
import { setupS3Bucket } from "./utils/s3Setup";
import { fastifyCors } from "@fastify/cors";

validateEnv();

const app = Fastify({ logger: fastifyLoggerConfig });

app.register(fastifyCors, {
  origin: "https://keep-a-budget.up.railway.app", // Your specific frontend origin
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Headers your frontend sends
  credentials: true,
});
app.setErrorHandler(errorHandler);

app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

app.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

app.register(fastifySwagger, {
  swagger: {
    info: {
      title: "Keep a Budget API",
      description:
        "Budget tracking application for managing expenses and credit card invoices",
      version: "1.0.0",
    },
    host: `${process.env.HOST || "localhost"}:${process.env.PORT || "3000"}`,
    schemes: ["http", "https"],
    consumes: ["application/json"],
    produces: ["application/json"],
  },
});

app.register(fastifySwaggerUI, {
  routePrefix: "/docs",
});

app.register(invoiceRoutes, { prefix: "/invoices" });
app.register(expenseRoutes, { prefix: "/expenses" });

app.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

const start = async (): Promise<void> => {
  try {
    await connectDB();
    await setupS3Bucket();

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
