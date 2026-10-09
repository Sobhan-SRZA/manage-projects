// src/middleware/auth.ts
import type {
    Request,
    Response,
    NextFunction
} from "express";
import { Session } from "../models/Session";
import { config } from "../config/env";
import { User } from "../models/User";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: any;
    session?: any;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const auth = req.headers.authorization;
        if (!auth?.startsWith("Bearer "))
            return res.status(401).json({ error: "NO_TOKEN" });

        const token = auth.slice(7);
        const payload = jwt.verify(token, config.jwtSecret) as { sub: string };

        const session = await Session.findOne({ token, revoked: false });
        if (!session || !session.isActive()) {
            return res.status(401).json({ error: "SESSION_EXPIRED" });
        }

        const user = await User.findById(payload.sub);
        if (!user)
            return res.status(401).json({ error: "USER_NOT_FOUND" });

        req.user = user;
        req.session = session;

        // fire-and-forget touch
        session.touch().catch(() => { });

        next();
    }

    catch {
        return res.status(401).json({ error: "INVALID_TOKEN" });
    }
}