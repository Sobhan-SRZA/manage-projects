import { ZodSchema } from "zod";
import { AppError } from "./AppError";

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "داده‌های ورودی نامعتبر است",
            result.error.flatten().fieldErrors
        );
    }

    return result.data;
}

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */