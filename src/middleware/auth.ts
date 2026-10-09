import type {
    Response,
    NextFunction
} from "express";
import { verifyToken } from "../utils/token";
import { AppError } from "../utils/AppError";
import { Session } from "../models/Session";
import { User } from "../models/User";

export interface AuthRequest extends Request {
    user?: any;
    session?: any;
}

export async function requireAuth(req: any, _res: Response, next: NextFunction) {
    try {
        // 1. try cookie first
        let token = req.cookies?.access_token as string | undefined;

        // 2. fallback to Authorization header
        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.slice(7);
        }

        if (!token)
            throw new AppError(401, "NO_TOKEN", "ابتدا وارد شوید");

        const payload = verifyToken(token);
        if (payload.typ !== "access") {
            throw new AppError(401, "WRONG_TOKEN_TYPE", "نوع توکن اشتباه است");
        }

        const session = await Session.findOne({
            sessionId: payload.sid,
            revoked: false,
        });

        if (!session)
            throw new AppError(401, "SESSION_NOT_FOUND", "سشن یافت نشد");

        if (session.expiresAt < new Date()) {
            throw new AppError(401, "SESSION_EXPIRED", "سشن منقضی شده است");
        }

        const user = await User.findById(payload.sub).lean();
        if (!user)
            throw new AppError(401, "USER_NOT_FOUND", "کاربر یافت نشد");

        req.user = user;
        req.session = session;

        // fire-and-forget
        Session.updateOne(
            { _id: session._id },
            { lastActiveAt: new Date() }
        ).catch(() => { });

        next();
    }

    catch (err) {
        next(err);
    }
}

/** attach user if token exists, otherwise continue as guest */
export async function optionalAuth(req: any, _res: Response, next: NextFunction) {
    try {
        const token = req.cookies?.access_token as string | undefined;
        if (!token)
            return next();

        const payload = verifyToken(token);
        if (payload.typ !== "access")
            return next();

        const session = await Session.findOne({
            sessionId: payload.sid,
            revoked: false,
        });
        if (!session || session.expiresAt < new Date())
            return next();

        const user = await User.findById(payload.sub).lean();
        if (user) {
            req.user = user;
            req.session = session;
        }
    }

    catch {
        /* ignore */
    }

    next();
}

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */