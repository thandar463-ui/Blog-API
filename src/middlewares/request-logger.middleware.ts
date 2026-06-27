import pinoHttp from "pino-http";
import { logger } from "../lib/logger";

export const requestLogger = pinoHttp({
    logger,

    customLogLevel(req, res, err) {
        if (res.statusCode >= 500 || err) {
            return "error";
        }

        if (res.statusCode >= 400) {
            return "warn";
        }

        return "info";
    },

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
        return `${req.method} ${req.originalUrl} -> ${res.statusCode}`;
    },

    customErrorMessage: (req, res) => {
        return `${req.method} ${req.originalUrl} -> ${res.statusCode}`;
    },

    serializers: {
        req(req) {
            return undefined;
        },

        res(res) {
            return undefined;
        },
    },
});