import { requireAuth } from "../middleware/auth";
import { Router } from "express";
import * as ctrl from "../controllers/authController";

const router = Router();

// ---------- public ----------
router.post("/auth/register", ctrl.register);
router.post("/auth/login", ctrl.login);
router.post("/auth/refresh", ctrl.refresh);
router.post("/auth/logout", ctrl.logout);            // logout works without auth (just clears cookies)

// ---------- protected ----------
router.get("/auth/me", requireAuth, ctrl.me);
router.post("/auth/logout-all", requireAuth, ctrl.logoutAll);
router.get("/auth/sessions", requireAuth, ctrl.listSessions);
router.delete("/auth/sessions/:id", requireAuth, ctrl.revokeSession);

export default router;

/**
 * Copyright (c) 2026 Sobhan Rasoulzadeh Asl (Sobhan-SRZA / Mr. Sinre)
 *
 * Licensed under the BSD 3-Clause License.
 * See the LICENSE file in the project root for license information.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */