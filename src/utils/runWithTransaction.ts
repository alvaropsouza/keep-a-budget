import mongoose, { ClientSession } from "mongoose";
import logger from "../config/logger";

interface TransactionOptions {
  operationName?: string;
  metadata?: Record<string, unknown>;
}

const isTransactionUnsupportedError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes(
      "Transaction numbers are only allowed on a replica set member or mongos",
    ) ||
    message.includes("Transaction support is unavailable") ||
    message.includes("transactions are not supported")
  );
};

export const runWithTransaction = async <T>(
  operation: (session?: ClientSession) => Promise<T>,
  options: TransactionOptions = {},
): Promise<T> => {
  const { operationName = "unnamed-transaction", metadata = {} } = options;
  const session = await mongoose.startSession();
  let result!: T;

  try {
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } catch (error) {
    if (isTransactionUnsupportedError(error)) {
      logger.warn(
        {
          operationName,
          metadata,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        "Transactions unsupported for current MongoDB deployment; retrying without transaction",
      );

      return operation();
    }

    logger.error(
      {
        operationName,
        metadata,
        error,
      },
      "Transactional operation failed",
    );
    throw error;
  } finally {
    await session.endSession();
  }
};
