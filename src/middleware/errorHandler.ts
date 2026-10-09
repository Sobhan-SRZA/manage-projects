import type {
    Request,
    Response,
    NextFunction
} from "express";
import { AppError } from "../utils/AppError";
import { ZodError } from "zod";

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
) {
    // known operational errors
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            ok: false,
            code: err.code,
            message: err.message,
            details: err.details ?? undefined
        });
    }

    // zod (should be caught by validate() helper, but just in case)
    if (err instanceof ZodError) {
        return res.status(400).json({
            ok: false,
            code: "VALIDATION_ERROR",
            message: "داده‌های ورودی نامعتبر است",
            details: err.flatten().fieldErrors
        });
    }

    // mongoose duplicate key
    if (typeof err === "object" && err && (err as any).code === 11000) {
        const field = Object.keys((err as any).keyPattern || {})[0] || "field";
        return res.status(409).json({
            ok: false,
            code: "DUPLICATE_KEY",
            message: field === "email"
                ? "این ایمیل قبلاً ثبت شده است"
                : field === "username"
                    ? "این نام کاربری قبلاً گرفته شده است"
                    : "این مقدار تکراری است",
            details: { field }
        });
    }

    // mongoose validation
    if (typeof err === "object" && err && (err as any).name === "ValidationError") {
        return res.status(400).json({
            ok: false,
            code: "VALIDATION_ERROR",
            message: "داده‌های ورودی نامعتبر است",
            details: (err as any).errors
        });
    }

    // unknown → 500
    console.error("[UNHANDLED ERROR]", err);
    return res.status(500).json({
        ok: false,
        code: "INTERNAL_ERROR",
        message: "خطای داخلی سرور"
    });
}

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */