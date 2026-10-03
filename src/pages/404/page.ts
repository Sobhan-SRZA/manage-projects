import { Router } from "express";

const router = Router();

router.get("/api/404", (req, res) => {
    return res.render("404");
});

export default router;