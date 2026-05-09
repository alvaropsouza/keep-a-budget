import { Prisma } from "@prisma/client";
import logger from "../config/logger";
import { prisma } from "../lib/prisma";

interface TransactionOptions {
  operationName?: string;
  metadata?: Record<string, unknown>;
}

export const runWithTransaction = async <T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  options: TransactionOptions = {},
): Promise<T> => {
  const { operationName = "unnamed-transaction", metadata = {} } = options;

  try {
    return await prisma.$transaction(async (tx) => operation(tx));
  } catch (error) {
    logger.error(
      {
        operationName,
        metadata,
        error,
      },
      "Transactional operation failed",
    );
    throw error;
  }
};
