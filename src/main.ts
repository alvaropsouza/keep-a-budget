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
import { AppErrorFilter } from "./filters/app-error.filter";

async function bootstrap(): Promise<void> {
  validateEnv();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: fastifyLoggerConfig }),
  );

  app.useGlobalFilters(new AppErrorFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(corsPlugin as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(helmetPlugin as any);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(rateLimit as any, {
    max: 100,
    timeWindow: "1 minute",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(multipart as any, {
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
