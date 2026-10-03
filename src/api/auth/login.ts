import { Router } from "express";

const router = Router();

router.get("/auth/login", (req, res) => {
    res.send("fuck u")
});

export default router;