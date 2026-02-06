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
import fastifyCors, { FastifyCorsOptions } from "@fastify/cors";

validateEnv();

const app = Fastify({ logger: fastifyLoggerConfig });

const parseOrigins = (value?: string): string[] =>
  value
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const defaultOrigins = [
  process.env.FRONTEND_URL,
  "https://keep-a-budget.up.railway.app",
  ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:5173"]),
].filter(Boolean) as string[];

const allowedOrigins = Array.from(
  new Set([...parseOrigins(process.env.ALLOWED_ORIGINS), ...defaultOrigins]),
);

const allowedOriginPatterns = parseOrigins(
  process.env.ALLOWED_ORIGIN_PATTERNS,
).reduce<RegExp[]>((acc, pattern) => {
  try {
    acc.push(new RegExp(pattern));
  } catch (error) {
    logger.warn({ pattern, error }, "Invalid CORS origin pattern ignored");
  }
  return acc;
}, []);

const corsOptions: FastifyCorsOptions = {
  origin: (origin, cb) => {
    logger.debug({ origin, allowedOrigins }, "CORS origin check");
    
    if (!origin) {
      cb(null, true);
      return;
    }

    if (
      allowedOrigins.length === 0 ||
      allowedOrigins.includes(origin) ||
      allowedOriginPatterns.some((regex) => regex.test(origin))
    ) {
      cb(null, true);
      return;
    }

    logger.warn({ origin, allowedOrigins }, "Blocked CORS origin");
    cb(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  exposedHeaders: ["Content-Disposition"],
  preflight: true,
  strictPreflight: false,
};

app.register(fastifyCors, corsOptions);
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
