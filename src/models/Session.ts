import {
    Schema,
    model,
    Model,
    Types
} from "mongoose";

/* ------------------------------------------------------------------
   Sub-document: Device info
   ------------------------------------------------------------------ */
export interface IDeviceInfo {
    userAgent: string;        // raw User-Agent string
    deviceType: "desktop" | "mobile" | "tablet" | "bot" | "unknown";
    deviceVendor?: string;    // e.g. "Apple", "Samsung"
    deviceModel?: string;     // e.g. "iPhone 14 Pro"

    os?: string;              // e.g. "iOS"
    osVersion?: string;       // e.g. "17.2"

    browser?: string;         // e.g. "Chrome"
    browserVersion?: string;  // e.g. "120.0"

    engine?: string;          // e.g. "Blink", "WebKit"
    isBot?: boolean;
}

/* ------------------------------------------------------------------
   Sub-document: Location info
   ------------------------------------------------------------------ */
export interface ILocationInfo {
    ip: string;               // e.g. "192.168.1.1"
    ipVersion?: 4 | 6;

    country?: string;
    countryCode?: string;     // e.g. "IR"
    region?: string;          // e.g. "Tehran"
    city?: string;

    latitude?: number;
    longitude?: number;
    timezone?: string;        // e.g. "Asia/Tehran"
    isp?: string;
}

/* ------------------------------------------------------------------
   Sub-document: Hardware / network identifiers
   ------------------------------------------------------------------ */
export interface IClientIdentifiers {
    // MAC address is NEVER available from the browser.
    // Only servers on the same LAN or a native app can read it.
    // We keep the field for when the client is a native app / desktop agent.
    macAddress?: string | null;

    // Stable per-browser identifiers (best effort)
    fingerprint?: string;     // hash generated on the client
    deviceId?: string;        // your own persisted device UUID
}

/* ------------------------------------------------------------------
   Main: Session
   ------------------------------------------------------------------ */
export interface ISession {
    sessionId: string;            // stable random id
    user: Types.ObjectId;         // ref → User
    token: string;                // JWT (or a random session id)
    refreshToken?: string;

    device: IDeviceInfo;
    location: ILocationInfo;
    client: IClientIdentifiers;

    loginAt: Date;
    lastActiveAt: Date;
    expiresAt: Date;

    revoked: boolean;
    revokedAt?: Date | null;
    revokedReason?: string;

    createdAt: Date;
    updatedAt: Date;
}

export interface ISessionMethods {
    /** marks the session as revoked */
    revoke(reason?: string): Promise<void>;

    /** is the session still valid right now? */
    isActive(): boolean;

    /** updates lastActiveAt */
    touch(): Promise<void>;
}

type SessionModel = Model<ISession, {}, ISessionMethods>;

/* ---------------- sub-schemas ---------------- */
const deviceSchema = new Schema<IDeviceInfo>(
    {
        userAgent: { type: String, required: true },
        deviceType: {
            type: String,
            enum: ["desktop", "mobile", "tablet", "bot", "unknown"],
            default: "unknown",
        },
        deviceVendor: String,
        deviceModel: String,
        os: String,
        osVersion: String,
        browser: String,
        browserVersion: String,
        engine: String,
        isBot: { type: Boolean, default: false },
    },
    { _id: false }
);

const locationSchema = new Schema<ILocationInfo>(
    {
        ip: { type: String, required: true },
        ipVersion: { type: Number, enum: [4, 6] },
        country: String,
        countryCode: String,
        region: String,
        city: String,
        latitude: Number,
        longitude: Number,
        timezone: String,
        isp: String,
    },
    { _id: false }
);

const clientSchema = new Schema<IClientIdentifiers>(
    {
        macAddress: { type: String, default: null },
        fingerprint: String,
        deviceId: String,
    },
    { _id: false }
);

/* ---------------- session schema ---------------- */
const sessionSchema = new Schema<ISession, SessionModel, ISessionMethods>(
    {
        sessionId: { type: String, required: true, unique: true, index: true },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        token: { type: String, required: true, unique: true, index: true },
        refreshToken: { type: String, select: false },

        device: { type: deviceSchema, required: true },
        location: { type: locationSchema, required: true },
        client: { type: clientSchema, default: () => ({}) },

        loginAt: { type: Date, default: () => new Date() },
        lastActiveAt: { type: Date, default: () => new Date() },
        expiresAt: { type: Date, required: true, index: true },

        revoked: { type: Boolean, default: false, index: true },
        revokedAt: { type: Date, default: null },
        revokedReason: String,
    },
    { timestamps: true }
);

/* ---------------- indexes ---------------- */
// fast lookup of "all active sessions for a user"
sessionSchema.index({ user: 1, revoked: 1, expiresAt: 1 });

// auto-delete expired sessions (Mongo TTL index)
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/* ---------------- methods ---------------- */
sessionSchema.method("revoke", async function (reason?: string) {
    this.revoked = true;
    this.revokedAt = new Date();
    this.revokedReason = reason;

    await this.save();
});

sessionSchema.method("isActive", function () {
    return !this.revoked && this.expiresAt > new Date();
});

sessionSchema.method("touch", async function () {
    this.lastActiveAt = new Date();

    await this.save();
});

export const Session = model<ISession, SessionModel>("Session", sessionSchema);

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */