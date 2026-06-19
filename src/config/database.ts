import logger from "./logger";
import { prisma } from "../config/prisma";

const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info("Prisma connected successfully");
  } catch (error) {
    logger.error({ error }, "Database connection error");
    process.exit(1);
  }
};

export default connectDB;
