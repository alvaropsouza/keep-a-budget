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
import userRoutes from "./routes/users";
import fixedExpenseRoutes from "./routes/fixedExpenses";
import authRoutes from "./routes/auth";
import logger, { fastifyLoggerConfig } from "./config/logger";
import { errorHandler } from "./config/errorHandler";
import { setupS3Bucket } from "./utils/s3Setup";
import { invoiceClosureJob } from "./jobs/invoiceClosureJob";
import corsPlugin from "./plugins/cors";
import helmetPlugin from "./plugins/helmet";
import authGuardPlugin from "./plugins/authGuard";

validateEnv();

const app = Fastify({ logger: fastifyLoggerConfig });

app.register(corsPlugin);
app.register(helmetPlugin);
app.register(authGuardPlugin);
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

if (process.env.NODE_ENV !== "production") {
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
}

app.register(invoiceRoutes, { prefix: "/invoices" });
app.register(expenseRoutes, { prefix: "/expenses" });
app.register(userRoutes, { prefix: "/users" });
app.register(fixedExpenseRoutes, { prefix: "/fixed-expenses" });
app.register(authRoutes, { prefix: "/auth" });

app.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

const start = async (): Promise<void> => {
  try {
    await connectDB();
    await setupS3Bucket();

    // Start the invoice closure job
    invoiceClosureJob.start();

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
