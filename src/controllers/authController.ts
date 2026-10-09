import {
    signAccessToken,
    signRefreshToken,
    verifyToken,
    randomToken,
} from "../utils/token";
import {
    AppError,
    Conflict,
    Unauthorized
} from "../utils/AppError";
import type {
    Request,
    Response
} from "express";
import {
    ErrorCodes,
    ErrorMessages
} from "../utils/errorCodes";
import {
    registerSchema,
    loginSchema
} from "../validators/authValidator";
import { createSession } from "../services/sessionService";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../utils/validate";
import { Session } from "../models/Session";
import { User } from "../models/User";

/* ==================================================================
   Helpers
   ================================================================== */
const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
};

function setAuthCookies(res: Response, access: string, refresh: string, remember: boolean) {
    const accessMaxAge = remember ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
    const refreshMaxAge = 30 * 24 * 60 * 60 * 1000;
    res.cookie("access_token", access, { ...cookieOpts, maxAge: accessMaxAge });
    res.cookie("refresh_token", refresh, { ...cookieOpts, maxAge: refreshMaxAge });
}

function clearAuthCookies(res: Response) {
    res.clearCookie("access_token", cookieOpts);
    res.clearCookie("refresh_token", cookieOpts);
}

function publicUser(u: any) {
    return {
        id: u._id,
        name: u.name,
        username: u.username,
        email: u.email,
        createdAt: u.createdAt,
    };
}

/* ==================================================================
   REGISTER
   ================================================================== */
export const register = asyncHandler(async (req: Request, res: Response) => {
    const data = validate(registerSchema, req.body);

    const usernameLower = data.username.toLowerCase();
    const emailLower = data.email.toLowerCase();

    /* -------- چک تکراری بودن به صورت case-insensitive -------- */
    const [existingUsername, existingEmail] = await Promise.all([
        User.findOne({ usernameLower }).lean(),
        User.findOne({ email: emailLower }).lean(),
    ]);

    if (existingUsername) {
        throw Conflict(
            ErrorCodes.USERNAME_TAKEN,
            ErrorMessages[ErrorCodes.USERNAME_TAKEN],
            { field: "username" }
        );
    }

    if (existingEmail) {
        throw Conflict(
            ErrorCodes.EMAIL_TAKEN,
            ErrorMessages[ErrorCodes.EMAIL_TAKEN],
            { field: "email" }
        );
    }

    /* -------- ساخت کاربر -------- */
    let user;
    try {
        user = await User.create({
            name: data.name,
            username: data.username,
            usernameLower,
            email: emailLower,
            password: data.password,
        });
    }

    catch (err: any) {
        // race condition: دو تا request همزمان
        if (err?.code === 11000) {
            const dupField = Object.keys(err.keyPattern || {})[0] || "";
            if (dupField === "usernameLower" || dupField === "username") {
                throw Conflict(ErrorCodes.USERNAME_TAKEN, undefined, { field: "username" });
            }
            if (dupField === "email") {
                throw Conflict(ErrorCodes.EMAIL_TAKEN, undefined, { field: "email" });
            }
        }
        throw err;
    }

    /* -------- توکن‌ها + سشن -------- */
    const sessionId = randomToken(16);
    const access = signAccessToken({ sub: user._id.toString(), sid: sessionId });
    const refresh = signRefreshToken({ sub: user._id.toString(), sid: sessionId });

    try {
        await createSession({
            userId: user._id,
            sessionId,
            token: access,
            refreshToken: refresh,
            req,
            ttlDays: 7,
        });
    }

    catch (err) {
        // اگه سشن ساخته نشد، کاربر رو پاک کن که دیتابیس تمیز بمونه
        await User.deleteOne({ _id: user._id }).catch(() => { });
        throw err;
    }

    setAuthCookies(res, access, refresh, true);

    res.status(201).json({
        ok: true,
        message: "حساب با موفقیت ساخته شد",
        user: publicUser(user),
    });
});

/* ==================================================================
   LOGIN  (email OR username, case-insensitive)
   ================================================================== */
export const login = asyncHandler(async (req: Request, res: Response) => {
    const data = validate(loginSchema, req.body);

    const raw = data.identifier.trim();
    const emailLower = raw.toLowerCase();
    const usernameLower = raw.toLowerCase();

    const user = await User.findOne({
        $or: [
            { email: emailLower },
            { usernameLower },
        ],
    }).select("+password");

    /* -------- کاربر پیدا نشد -------- */
    if (!user) {
        // پیام یکسان برای جلوگیری از user-enumeration
        throw Unauthorized(
            ErrorCodes.INVALID_CREDENTIALS,
            ErrorMessages[ErrorCodes.INVALID_CREDENTIALS]
        );
    }

    /* -------- پسورد چک -------- */
    const ok = await user.comparePassword(data.password);
    if (!ok) {
        throw Unauthorized(
            ErrorCodes.INVALID_CREDENTIALS,
            ErrorMessages[ErrorCodes.INVALID_CREDENTIALS]
        );
    }

    /* -------- توکن‌ها + سشن -------- */
    const sessionId = randomToken(16);
    const access = signAccessToken({ sub: user._id.toString(), sid: sessionId });
    const refresh = signRefreshToken({ sub: user._id.toString(), sid: sessionId });

    await createSession({
        userId: user._id,
        sessionId,
        token: access,
        refreshToken: refresh,
        req,
        ttlDays: data.remember ? 30 : 7,
    });

    setAuthCookies(res, access, refresh, !!data.remember);

    res.json({
        ok: true,
        message: "ورود موفق",
        user: publicUser(user),
    });
});

/* ==================================================================
   LOGOUT
   ================================================================== */
export const logout = asyncHandler(async (req: Request, res: Response) => {
    const refresh = req.cookies?.refresh_token as string | undefined;

    if (refresh) {
        try {
            const payload = verifyToken(refresh);
            await Session.findOneAndUpdate(
                { sessionId: payload.sid, revoked: false },
                { revoked: true, revokedAt: new Date(), revokedReason: "user_logout" }
            );
        } catch {
            /* ignore */
        }
    }

    clearAuthCookies(res);
    res.json({ ok: true, message: "خروج انجام شد" });
});

/* ==================================================================
   LOGOUT ALL
   ================================================================== */
export const logoutAll = asyncHandler(async (req: any, res: Response) => {
    if (!req.user) throw Unauthorized(ErrorCodes.UNAUTHENTICATED);

    await Session.updateMany(
        { user: req.user._id, revoked: false },
        { revoked: true, revokedAt: new Date(), revokedReason: "user_logout_all" }
    );

    clearAuthCookies(res);
    res.json({ ok: true, message: "از همه دستگاه‌ها خارج شدید" });
});

/* ==================================================================
   ME
   ================================================================== */
export const me = asyncHandler(async (req: any, res: Response) => {
    if (!req.user) throw Unauthorized(ErrorCodes.UNAUTHENTICATED);

    res.json({
        ok: true,
        user: publicUser(req.user),
        session: req.session
            ? {
                id: req.session._id,
                loginAt: req.session.loginAt,
                lastActiveAt: req.session.lastActiveAt,
                device: req.session.device,
                location: {
                    ip: req.session.location.ip,
                    city: req.session.location.city,
                    country: req.session.location.country,
                },
            }
            : null,
    });
});

/* ==================================================================
   REFRESH
   ================================================================== */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (!refreshToken) throw Unauthorized(ErrorCodes.NO_REFRESH_TOKEN);

    let payload;
    try {
        payload = verifyToken(refreshToken);
    } catch {
        throw Unauthorized(ErrorCodes.INVALID_REFRESH_TOKEN);
    }

    if (payload.typ !== "refresh") throw Unauthorized(ErrorCodes.WRONG_TOKEN_TYPE);

    const session = await Session.findOne({
        sessionId: payload.sid,
        refreshToken,
        revoked: false,
    });

    if (!session) throw Unauthorized(ErrorCodes.SESSION_NOT_FOUND);
    if (session.expiresAt < new Date()) throw Unauthorized(ErrorCodes.SESSION_EXPIRED);

    const access = signAccessToken({ sub: payload.sub, sid: payload.sid });
    session.token = access;
    session.lastActiveAt = new Date();
    await session.save();

    res.cookie("access_token", access, { ...cookieOpts, maxAge: 60 * 60 * 1000 });
    res.json({ ok: true, access });
});

/* ==================================================================
   LIST SESSIONS
   ================================================================== */
export const listSessions = asyncHandler(async (req: any, res: Response) => {
    if (!req.user) throw Unauthorized(ErrorCodes.UNAUTHENTICATED);

    const sessions = await Session.find({
        user: req.user._id,
        revoked: false,
        expiresAt: { $gt: new Date() },
    })
        .sort({ lastActiveAt: -1 })
        .lean();

    res.json({
        ok: true,
        current: req.session?._id ?? null,
        sessions: sessions.map((s) => ({
            id: s._id,
            loginAt: s.loginAt,
            lastActiveAt: s.lastActiveAt,
            expiresAt: s.expiresAt,
            device: s.device,
            location: {
                ip: s.location.ip,
                city: s.location.city,
                country: s.location.country,
                isp: s.location.isp,
            },
        })),
    });
});

/* ==================================================================
   REVOKE SESSION
   ================================================================== */
export const revokeSession = asyncHandler(async (req: any, res: Response) => {
    if (!req.user) throw Unauthorized(ErrorCodes.UNAUTHENTICATED);

    const session = await Session.findOne({
        _id: req.params.id,
        user: req.user._id,
        revoked: false,
    });

    if (!session) {
        throw new AppError(404, ErrorCodes.SESSION_NOT_FOUND);
    }

    session.revoked = true;
    session.revokedAt = new Date();
    session.revokedReason = "user_revoked";
    await session.save();

    if (req.session && String(req.session._id) === String(session._id)) {
        clearAuthCookies(res);
    }

    res.json({ ok: true, message: "سشن بسته شد" });
});

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */