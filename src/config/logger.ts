import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
});

// Fastify logger configuration
export const fastifyLoggerConfig = {
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          singleLine: false,
          ignore: "pid,hostname",
          translateTime: "SYS:standard",
          messageFormat: "{levelLabel} {msg}",
        },
      },
};

export default pinoLogger;
