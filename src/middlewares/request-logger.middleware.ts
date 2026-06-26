import pinoHttp from "pino-http";
import { logger } from "../lib/logger";

export const requestLogger = pinoHttp({
    logger,
    redact: {
        paths: ["req.headers.authorization"],
        censor: "[REDACTED]",
    },

    genReqId: (req) => (req as any).id,

    customProps: (req: any) => ({
        requestId: req.id,
        userId: req.user?.id || "guest",
    }),

    customSuccessMessage: (req, res) => {
        return `${req.method} ${req.url} -> ${res.statusCode}`;
    },

    customErrorMessage: (req, res) => {
        return `${req.method} ${req.url} failed`;
    },
});