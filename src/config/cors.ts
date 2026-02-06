import fp from "fastify-plugin";
import cors from "@fastify/cors";
import "dotenv/config";
import logger from "./logger";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://keep-a-budget.up.railway.app",
];

const parseList = (value?: string): string[] =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

const SPECIAL_REGEX_CHARS = new Set([
  ".",
  "*",
  "+",
  "?",
  "^",
  "$",
  "{",
  "}",
  "(",
  ")",
  "|",
  "[",
  "]",
  "\\",
]);

const escapeRegex = (value: string): string => {
  let escapedValue = "";

  for (const char of value) {
    if (SPECIAL_REGEX_CHARS.has(char)) {
      escapedValue += "\\\\";
    }

    escapedValue += char;
  }

  return escapedValue;
};

const wildcardToRegex = (pattern: string): RegExp => {
  const escapedSegments = pattern.split("*").map(escapeRegex);
  return new RegExp(`^${escapedSegments.join(".*")}$`);
};

const envOrigins = parseList(process.env.ALLOWED_ORIGINS);
const envOriginPatterns = parseList(process.env.ALLOWED_ORIGIN_PATTERNS);

const allowedExactOrigins = new Set([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...envOrigins,
]);

const allowedOriginRegexes = envOriginPatterns.map(wildcardToRegex);

const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) {
    return true;
  }

  if (allowedExactOrigins.has(origin)) {
    return true;
  }

  return allowedOriginRegexes.some((regex) => regex.test(origin));
};

logger.debug(
  {
    allowedExactOrigins: Array.from(allowedExactOrigins),
    allowedOriginPatterns: envOriginPatterns,
  },
  "CORS configuration loaded",
);

export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin(origin, cb) {
      if (isOriginAllowed(origin)) {
        cb(null, true);
        return;
      }

      logger.warn({ origin }, "Blocked CORS origin");
      cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
    strictPreflight: false,
    maxAge: 60 * 60, // 1 hour
  });
});
