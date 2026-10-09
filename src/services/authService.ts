import { User } from '../models/User';
import { Session } from '../models/Session';
import { createSession } from './sessionService';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import type { Request } from 'express';

export async function login(
    identifier: string,     // email OR username
    password: string,
    req: Request
) {
    const user = await User.findOne({
        $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
    }).select('+password');

    if (!user) throw new Error('INVALID_CREDENTIALS');

    const ok = await user.comparePassword(password);
    if (!ok) throw new Error('INVALID_CREDENTIALS');

    const token = jwt.sign(
        { sub: user._id.toString() },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
    );

    const session = await createSession({
        userId: user._id,
        token,
        req,
        ttlDays: 7,
    });

    return { user, session, token };
}

export async function logout(token: string) {
    await Session.findOneAndUpdate(
        { token, revoked: false },
        { revoked: true, revokedAt: new Date(), revokedReason: 'user_logout' }
    );
}

export async function listUserSessions(userId: string) {
    return Session.find({ user: userId, revoked: false, expiresAt: { $gt: new Date() } })
        .sort({ lastActiveAt: -1 })
        .lean();
}