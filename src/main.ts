import "dotenv/config";
import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { AppModule } from "./app.module";
import connectDB from "./config/database";
import validateEnv from "./config/validateEnv";
import { fastifyLoggerConfig } from "./config/logger";
import { setupS3Bucket } from "./utils/s3Setup";
import { invoiceClosureJob } from "./jobs/invoiceClosureJob";
import corsPlugin from "./plugins/cors";
import helmetPlugin from "./plugins/helmet";

async function bootstrap(): Promise<void> {
  validateEnv();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: fastifyLoggerConfig }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.register(corsPlugin);
  await app.register(helmetPlugin);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  await connectDB();
  await setupS3Bucket();

  invoiceClosureJob.start();

  const port = Number.parseInt(process.env.PORT || "3000", 10);
  const host = process.env.HOST || "0.0.0.0";

  await app.listen(port, host);
}

void bootstrap();
