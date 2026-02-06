import { Router } from "express";
import { pool } from "../db/client";

const router = Router();

router.get("/", async (req, res) => {
    const search = req.query.search?.toString() || "";
    const page = parseInt(req.query.page?.toString() || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    try {
        const result = await pool.query(
            `SELECT * FROM products
       WHERE name ILIKE $1
       ORDER BY name
       LIMIT $2 OFFSET $3`,
            [`%${search}%`, limit, offset]
        );

        res.json({
            page,
            limit,
            total: result.rowCount,
            data: result.rows,
        });
    } catch (err: any) {
        console.error("DB ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;
