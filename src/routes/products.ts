import { Router } from "express";
import { pool } from "../db/client"; // твій файл підключення до Supabase/Postgres

const router = Router();

// GET /products?search=apple&page=1
router.get("/", async (req, res) => {
    const search = req.query.search?.toString() || "";
    const page = parseInt(req.query.page?.toString() || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    try {
        const result = await pool.query(
            `SELECT * FROM products
       WHERE product_name ILIKE $1
       ORDER BY product_name
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
