import "dotenv/config";
import validateEnv from "./config/validateEnv";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import connectDB from "./config/database";
import invoiceRoutes from "./routes/invoices";
import expenseRoutes from "./routes/expenses";

// Validate environment variables before starting the server
validateEnv();

const app = Fastify({ logger: true });

// Register rate limiting
app.register(rateLimit, {
  max: 100, // Maximum 100 requests
  timeWindow: "1 minute", // Per minute
});

// Register multipart for file uploads
app.register(multipart);

// Register routes
app.register(invoiceRoutes, { prefix: "/api/invoices" });
app.register(expenseRoutes, { prefix: "/api/expenses" });

// Health check route
app.get("/health", async (request, reply) => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Start server
const start = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Fastify server
    const port = Number.parseInt(process.env.PORT || "3000");
    const host = process.env.HOST || "0.0.0.0";

    await app.listen({ port, host });
    console.log(`Server is running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

export default app;
