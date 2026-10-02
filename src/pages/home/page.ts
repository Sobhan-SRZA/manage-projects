import { Router } from "express";

const router = Router();

router.get('/', (req, res) => {
    return res
        .status(404)
        .type("application/problem+json")
        .json({
            code: 404,
            message: "Endpoint not founded."
        });
});

export default router;