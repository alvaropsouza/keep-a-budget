import mongoose from "mongoose";
import logger from "./logger";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error(error, "MongoDB connection error");
    process.exit(1);
  }
};

export default connectDB;
