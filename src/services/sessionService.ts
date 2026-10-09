import { parseUserAgent } from '../utils/parseUserAgent';
import type { Request } from 'express';
import { getClientIp } from '../utils/geoip';
import { lookupIp } from '../utils/geoip';
import { Session } from '../models/Session';
import { Types } from 'mongoose';

interface CreateSessionInput {
    userId: Types.ObjectId | string;
    token: string;
    refreshToken?: string;
    req: Request;
    ttlDays?: number;               // default 7
    deviceId?: string;
    fingerprint?: string;
    macAddress?: string | null;     // from native client only
}

export async function createSession(input: CreateSessionInput) {
    const {
        userId,
        token,
        refreshToken,
        req,
        ttlDays = 7,
        deviceId,
        fingerprint,
        macAddress,
    } = input;

    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = getClientIp(req);

    // parallel calls for speed
    const [device, location] = await Promise.all([
        Promise.resolve(parseUserAgent(userAgent)),
        lookupIp(ip),
    ]);

    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    const session = await Session.create({
        user: userId,
        token,
        refreshToken,
        device,
        location,
        client: { deviceId, fingerprint, macAddress: macAddress ?? null },
        loginAt: new Date(),
        lastActiveAt: new Date(),
        expiresAt,
        revoked: false,
    });

    return session;
}

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */