import fp from "fastify-plugin";
import cors from "@fastify/cors";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://keep-a-budget.up.railway.app",
];

const envOrigins = process.env.ALLOWED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...(envOrigins ?? []),
]);

const normalizeOrigin = (origin?: string): string | undefined =>
  origin?.replace(/\/$/, "");

const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) {
    // Same-origin requests (no Origin header) should pass.
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  for (const allowed of allowedOrigins) {
    if (normalizeOrigin(allowed) === normalizedOrigin) {
      return true;
    }
  }

  return false;
};

export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin(origin, cb) {
      if (isAllowedOrigin(origin)) {
        cb(null, true);
        return;
      }

      fastify.log.warn({ origin }, "Blocked request due to CORS origin");
      cb(new Error("Origin not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
});
