import {
    signAccessToken,
    signRefreshToken,
    verifyToken,
    randomToken,
} from '../utils/token';
import {
    registerSchema,
    loginSchema
} from '../validators/authValidator';
import type {
    Request,
    Response
} from 'express';
import { createSession } from '../services/sessionService';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../utils/validate';
import { AppError } from '../utils/AppError';
import { Session } from '../models/Session';
import { User } from '../models/User';

/* ------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------ */
const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/'
};

function setAuthCookies(res: Response, access: string, refresh: string, remember: boolean) {
    const accessMaxAge = remember ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000; // 7d or 1h
    const refreshMaxAge = 30 * 24 * 60 * 60 * 1000; // 30d

    res.cookie('access_token', access, { ...cookieOpts, maxAge: accessMaxAge });
    res.cookie('refresh_token', refresh, { ...cookieOpts, maxAge: refreshMaxAge });
}

function clearAuthCookies(res: Response) {
    res.clearCookie('access_token', cookieOpts);
    res.clearCookie('refresh_token', cookieOpts);
}

/* ==================================================================
   REGISTER
   ================================================================== */
export const register = asyncHandler(async (req: Request, res: Response) => {
    const data = validate(registerSchema, req.body);

    // check duplicates (case-insensitive email, exact username)
    const existing = await User.findOne({
        $or: [{ email: data.email }, { username: data.username }],
    }).lean();

    if (existing) {
        const field = existing.email === data.email ? 'email' : 'username';
        throw new AppError(409, 'USER_EXISTS', field === 'email'
            ? 'این ایمیل قبلاً ثبت شده است'
            : 'این نام کاربری قبلاً گرفته شده است',
            { field });
    }

    // create user (password hashed by pre-save hook)
    const user = await User.create({
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password
    });

    // generate tokens — need a sessionId first, so create sessionId now
    const sessionId = randomToken(16);
    const access = signAccessToken({ sub: user._id.toString(), sid: sessionId });
    const refresh = signRefreshToken({ sub: user._id.toString(), sid: sessionId });

    // create Session doc with device + location info
    await createSession({
        userId: user._id,
        token: access,
        refreshToken: refresh,
        req,
        ttlDays: 7
    });

    setAuthCookies(res, access, refresh, true);

    res.status(201).json({
        ok: true,
        user: {
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email
        }
    });
});

/* ==================================================================
   LOGIN  (email OR username)
   ================================================================== */
export const login = asyncHandler(async (req: Request, res: Response) => {
    const data = validate(loginSchema, req.body);

    const identifier = data.identifier.toLowerCase();

    const user = await User.findOne({
        $or: [{ email: identifier }, { username: data.identifier }],
    }).select('+password');

    if (!user) {
        // do not reveal which field is wrong
        throw new AppError(401, 'INVALID_CREDENTIALS', 'ایمیل/نام کاربری یا رمز عبور اشتباه است');
    }

    const ok = await user.comparePassword(data.password);
    if (!ok) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'ایمیل/نام کاربری یا رمز عبور اشتباه است');
    }

    // create session
    const sessionId = randomToken(16);
    const access = signAccessToken({ sub: user._id.toString(), sid: sessionId });
    const refresh = signRefreshToken({ sub: user._id.toString(), sid: sessionId });

    await createSession({
        userId: user._id,
        token: access,
        refreshToken: refresh,
        req,
        ttlDays: data.remember ? 30 : 7
    });

    setAuthCookies(res, access, refresh, !!data.remember);

    res.json({
        ok: true,
        user: {
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email
        }
    });
});

/* ==================================================================
   LOGOUT  (current session only)
   ================================================================== */
export const logout = asyncHandler(async (req: Request, res: Response) => {
    const refresh = req.cookies?.refresh_token as string | undefined;

    if (refresh) {
        try {
            const payload = verifyToken(refresh);
            await Session.findOneAndUpdate(
                { sessionId: payload.sid, revoked: false },
                { revoked: true, revokedAt: new Date(), revokedReason: 'user_logout' }
            );
        }

        catch {
            /* ignore expired/invalid refresh token */
        }
    }

    clearAuthCookies(res);
    res.json({ ok: true });
});

/* ==================================================================
   LOGOUT ALL  (all sessions of current user)
   ================================================================== */
export const logoutAll = asyncHandler(async (req: any, res: Response) => {
    if (!req.user)
        throw new AppError(401, 'UNAUTHENTICATED', 'ابتدا وارد شوید');

    await Session.updateMany(
        { user: req.user._id, revoked: false },
        { revoked: true, revokedAt: new Date(), revokedReason: 'user_logout_all' }
    );

    clearAuthCookies(res);
    res.json({ ok: true });
});

/* ==================================================================
   ME  (return current user)
   ================================================================== */
export const me = asyncHandler(async (req: any, res: Response) => {
    if (!req.user)
        throw new AppError(401, 'UNAUTHENTICATED', 'ابتدا وارد شوید');

    res.json({
        ok: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            username: req.user.username,
            email: req.user.email
        },

        session: req.session
            ? {
                id: req.session._id,
                loginAt: req.session.loginAt,
                lastActiveAt: req.session.lastActiveAt,
                device: req.session.device,
                location: {
                    ip: req.session.location.ip,
                    city: req.session.location.city,
                    country: req.session.location.country
                }
            }
            : null
    });
});

/* ==================================================================
   REFRESH  (rotate access token using refresh token)
   ================================================================== */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (!refreshToken) {
        throw new AppError(401, 'NO_REFRESH_TOKEN', 'توکن refresh موجود نیست');
    }

    let payload;
    try {
        payload = verifyToken(refreshToken);
    }

    catch {
        throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'توکن refresh نامعتبر یا منقضی است');
    }

    if (payload.typ !== 'refresh') {
        throw new AppError(401, 'WRONG_TOKEN_TYPE', 'نوع توکن اشتباه است');
    }

    const session = await Session.findOne({
        sessionId: payload.sid,
        refreshToken,
        revoked: false,
    });

    if (!session || session.expiresAt < new Date()) {
        throw new AppError(401, 'SESSION_EXPIRED', 'سشن منقضی شده است');
    }

    // rotate: issue new access token (keep same sessionId)
    const access = signAccessToken({ sub: payload.sub, sid: payload.sid });

    // update token in DB
    session.token = access;
    session.lastActiveAt = new Date();
    await session.save();

    res.cookie('access_token', access, { ...cookieOpts, maxAge: 60 * 60 * 1000 });
    res.json({ ok: true, access });
});

/* ==================================================================
   SESSIONS  (list active sessions of current user)
   ================================================================== */
export const listSessions = asyncHandler(async (req: any, res: Response) => {
    if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'ابتدا وارد شوید');

    const sessions = await Session.find({
        user: req.user._id,
        revoked: false,
        expiresAt: { $gt: new Date() }
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
                isp: s.location.isp
            }
        }))
    });
});

/* ==================================================================
   REVOKE  (revoke a specific session by id)
   ================================================================== */
export const revokeSession = asyncHandler(async (req: any, res: Response) => {
    if (!req.user)
        throw new AppError(401, 'UNAUTHENTICATED', 'ابتدا وارد شوید');

    const session = await Session.findOne({
        _id: req.params.id,
        user: req.user._id,
        revoked: false
    });

    if (!session)
        throw new AppError(404, 'SESSION_NOT_FOUND', 'سشن پیدا نشد');

    session.revoked = true;
    session.revokedAt = new Date();
    session.revokedReason = 'user_revoked';
    await session.save();

    // if user revoked their own current session, clear cookies
    if (req.session && String(req.session._id) === String(session._id)) {
        clearAuthCookies(res);
    }

    res.json({ ok: true });
});

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */