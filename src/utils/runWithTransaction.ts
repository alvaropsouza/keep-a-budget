import { Prisma } from "../generated/prisma/client/client";
import logger from "../config/logger";
import { prisma } from "../lib/prisma";

type TransactionCallback = Extract<
  Parameters<typeof prisma.$transaction>[0],
  (tx: unknown) => Promise<unknown>
>;

export type TxClient = Parameters<TransactionCallback>[0];

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
