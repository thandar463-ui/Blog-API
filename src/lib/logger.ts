import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({

    level: isProduction ? "info" : "debug",


    timestamp: pino.stdTimeFunctions.isoTime,

    transport: !isProduction
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,
                ignore: "pid,hostname",
                translateTime: "SYS:standard",
            },
        }
        : undefined,
});