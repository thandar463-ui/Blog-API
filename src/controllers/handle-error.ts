import { ApiError } from "./api-error";
import { ZodError } from "zod";
import { Response } from "express";

function handleErrors(res: Response, err: unknown) {

    if (err instanceof ApiError) {
        return res
            .status(err.statusCode)
            .json({ message: err.message, statusCode: err.statusCode })
    }


    if (err instanceof ZodError) {
        return res.status(400).json({
            message: `Invalid data in ${err.issues
                .map((issue) => issue.path.join("."))
                .join(", ")}`,
        });
    }

    console.error(err);
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ message: errorMessage, });
}

export { handleErrors }