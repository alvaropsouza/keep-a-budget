import pino from "pino";
import type { FastifyRequest } from "fastify";

const isProduction = process.env.NODE_ENV === "production";

// Never let PII / secrets reach the logs, regardless of what gets logged.
const redact = {
  paths: [
    "salary",
    "*.salary",
    "cpf",
    "*.cpf",
    "rg",
    "*.rg",
    "rgHash",
    "*.rgHash",
    "email",
    "*.email",
    "phone",
    "*.phone",
    "token",
    "*.token",
    "sessionToken",
    "*.sessionToken",
    "req.headers.authorization",
    "req.headers.cookie",
    'res.headers["set-cookie"]',
  ],
  censor: "[redacted]",
};

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  redact,
});

// `redact` only reaches logged object keys. The by-email route puts the address
// in the path itself, so the request URL needs the same treatment.
const EMAIL_IN_URL = /[^/?&=]+(?:@|%40)[^/?&=]+/gi;

const sanitizeUrl = (url: string): string => url.replace(EMAIL_IN_URL, "[redacted]");

export const fastifyLoggerConfig = {
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  redact,
  serializers: {
    req(request: FastifyRequest) {
      return {
        method: request.method,
        url: sanitizeUrl(request.url),
        host: request.host,
        remoteAddress: request.ip,
        remotePort: request.socket?.remotePort,
      };
    },
  },
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          singleLine: false,
          ignore: "pid,hostname",
          translateTime: "SYS:standard",
        },
      },
};

export default pinoLogger;
