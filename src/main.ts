import "dotenv/config";
import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { name, version, description } from "../package.json";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { AppModule } from "./app.module";
import connectDB from "./config/database";
import validateEnv from "./config/validateEnv";
import { fastifyLoggerConfig } from "./config/logger";
import { setupS3Bucket } from "./utils/s3-setup";
import { invoiceClosureJob } from "./jobs/invoice-closure.job";
import { sessionCleanupJob } from "./jobs/session-cleanup.job";
import corsPlugin from "./plugins/cors";
import helmetPlugin from "./plugins/helmet";
import { AppErrorFilter } from "./filters/app-error.filter";
import { CacheService } from "./services/cache.service";
import { setupCacheMiddleware } from "./lib/prisma";

async function bootstrap(): Promise<void> {
  validateEnv();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: fastifyLoggerConfig, trustProxy: true }),
  );

  app.setGlobalPrefix("api", { exclude: ["health", "health/*path"] });

  app.useGlobalFilters(new AppErrorFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );


  await app.register(corsPlugin);
  await app.register(helmetPlugin);
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

  const swaggerConfig = new DocumentBuilder()
    .setTitle(name)
    .setDescription(description)
    .setVersion(version)
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  await connectDB();
  
  const cacheService = app.get(CacheService);
  setupCacheMiddleware(cacheService);
  
  await setupS3Bucket();

  invoiceClosureJob.start();
  sessionCleanupJob.start();

  const port = Number.parseInt(process.env.PORT || "3000", 10);
  const host = process.env.HOST || "0.0.0.0";

  await app.listen({ port, host });
  const url = await app.getUrl();
  new Logger("Bootstrap").log(`Server listening at ${url}`);
}

void bootstrap();
