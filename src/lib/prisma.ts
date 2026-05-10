import { PrismaClient } from "../generated/prisma/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { CacheService } from "../services/cache.service";

type PrismaClientInstance = ReturnType<typeof createPrismaClient>;

const tagMap: Record<string, string[]> = {
  User: ["user", "users:all"],
  CardInvoice: ["invoice", "invoices:all"],
  Expense: ["expense", "expenses:all"],
  FixedExpense: ["fixedExpense", "fixedExpenses:all"],
  Invoice: ["freelanceInvoice", "freelanceInvoices:all"],
};

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientInstance;
  cacheService?: CacheService;
  cacheMiddlewareConfigured?: boolean;
};

const createPrismaClient = (): PrismaClientInstance => {
  const client = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const result = await query(args);
          const cacheService = globalForPrisma.cacheService;

          if (!cacheService || !model) {
            return result;
          }

          if (operation === "create" || operation === "update" || operation === "upsert") {
            if (isRecord(result)) {
              invalidateCacheForModel(model, result, cacheService);
            }
            return result;
          }

          if (operation === "delete") {
            if (isRecord(args) && isRecord(args.where)) {
              invalidateCacheForModel(model, args.where, cacheService);
            }
            return result;
          }

          if (operation === "deleteMany") {
            invalidateModelCache(model, cacheService);
          }

          return result;
        },
      },
    },
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Configura o middleware de cache invalidation.
 * Deve ser chamado durante a inicialização do NestJS.
 */
export function setupCacheMiddleware(cacheService: CacheService): void {
  // Evita configurar o middleware múltiplas vezes
  if (globalForPrisma.cacheMiddlewareConfigured) {
    return;
  }

  globalForPrisma.cacheService = cacheService;
  globalForPrisma.cacheMiddlewareConfigured = true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Invalida cache baseado no modelo e dados afetados.
 */
function invalidateCacheForModel(model: string, data: Record<string, unknown>, cacheService: CacheService): void {
  const id = data?.id as string | undefined;

  if (model === "User" && id) {
    cacheService.invalidate([`user:${id}`, "user", "users:all"]);
  } else if (model === "CardInvoice" && id) {
    const userId = data?.userId as string | undefined;
    cacheService.invalidate([
      `invoice:${id}`,
      "invoice",
      "invoices:all",
      ...(userId ? [`user:${userId}:invoices`] : []),
    ]);
  } else if (model === "Expense" && id) {
    const userId = data?.userId as string | undefined;
    const cardInvoiceId = data?.cardInvoiceId as string | undefined;
    cacheService.invalidate([
      `expense:${id}`,
      "expense",
      "expenses:all",
      ...(userId ? [`user:${userId}:expenses`] : []),
      ...(cardInvoiceId ? [`invoice:${cardInvoiceId}:expenses`] : []),
    ]);
  } else if (model === "FixedExpense" && id) {
    const userId = data?.userId as string | undefined;
    cacheService.invalidate([
      `fixedExpense:${id}`,
      "fixedExpense",
      "fixedExpenses:all",
      ...(userId ? [`user:${userId}:fixedExpenses`] : []),
    ]);
  } else if (model === "Invoice" && id) {
    const userId = data?.userId as string | undefined;
    cacheService.invalidate([
      `freelanceInvoice:${id}`,
      "freelanceInvoice",
      "freelanceInvoices:all",
      ...(userId ? [`user:${userId}:freelanceInvoices`] : []),
    ]);
  }
}

/**
 * Invalida a tag genérica de um modelo.
 */
function invalidateModelCache(model: string, cacheService: CacheService): void {
  const tags = tagMap[model] || [];
  if (tags.length > 0) {
    cacheService.invalidate(tags);
  }
}
