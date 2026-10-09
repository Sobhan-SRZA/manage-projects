import type {
    Response,
    NextFunction,
    RequestHandler
} from "express";

export const asyncHandler =
    (fn: (req: any, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
        (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */