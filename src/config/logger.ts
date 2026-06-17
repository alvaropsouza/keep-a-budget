import pino from "pino";

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

export const fastifyLoggerConfig = {
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  redact,
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
