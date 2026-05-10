import "dotenv/config";
import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
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
import { CacheService } from "./services/cache.service";
import { setupCacheMiddleware } from "./lib/prisma";

async function bootstrap(): Promise<void> {
  validateEnv();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: fastifyLoggerConfig }),
  );

  app.setGlobalPrefix("api", { exclude: ["health", "health/(.*)"] });

  app.useGlobalFilters(new AppErrorFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Fastify's module augmentation causes structural mismatch between plugin
  // callback types (RawServerBase) and NestFastifyApplication.register()
  // (RawServerDefault). Safe at runtime — TypeScript limitation only.
  // @ts-expect-error — see comment above
  await app.register(corsPlugin);
  // @ts-expect-error — see comment above
  await app.register(helmetPlugin);
  // @ts-expect-error — see comment above
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  // @ts-expect-error — see comment above
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

  await connectDB();
  
  // Configurar middleware de cache invalidation
  const cacheService = app.get(CacheService);
  setupCacheMiddleware(cacheService);
  
  await setupS3Bucket();

  invoiceClosureJob.start();

  const port = Number.parseInt(process.env.PORT || "3000", 10);
  const host = process.env.HOST || "0.0.0.0";

  await app.listen({ port, host });
  const url = await app.getUrl();
  new Logger("Bootstrap").log(`Server listening at ${url}`);
}

void bootstrap();
