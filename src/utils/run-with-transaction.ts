import type { Prisma } from "../generated/prisma/client/client";
import logger from "../config/logger";
import { prisma } from "../config/prisma";

export type TxClient = Prisma.TransactionClient;

interface TransactionOptions {
  operationName?: string;
  metadata?: Record<string, unknown>;
}

export const runWithTransaction = async <T>(
  operation: (tx: TxClient) => Promise<T>,
  options: TransactionOptions = {},
): Promise<T> => {
  const { operationName = "unnamed-transaction", metadata = {} } = options;

  try {
    return await prisma.$transaction(async (tx) => operation(tx as TxClient));
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
