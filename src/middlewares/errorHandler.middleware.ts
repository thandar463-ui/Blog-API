import { logger } from "../lib/logger";

export const errorHandler = (err: any, req: any, res: any, next: any) => {
    logger.error({
        message: err.message,
        stack: err.stack,
        requestId: req.id,
        method: req.method,
        url: req.url,
        userId: req.user?.id,
    });

    res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
};