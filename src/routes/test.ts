// routes/test.ts
import { Router } from "express";
import { pool } from "../db/client";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT 1");
        res.json(result.rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
