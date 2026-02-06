import { Router } from "express";
import { pool } from "../db/client";

const router = Router();

router.get("/", async (req, res) => {
    const search = req.query.search?.toString() || "";

    try {
        // Бренди з LEFT JOIN, щоб враховувати товари без бренду
        const brands = await pool.query(
            `SELECT b.name, COUNT(p.id) AS count
             FROM products p
             LEFT JOIN brands b ON p.brand_id = b.id
             WHERE p.name ILIKE $1
             GROUP BY b.name
             ORDER BY count DESC`,
            [`%${search}%`]
        );

        // Категорії
        const categories = await pool.query(
            `SELECT pc.category AS name, COUNT(pc.product_id) AS count
             FROM product_categories pc
             JOIN products p ON p.id = pc.product_id
             WHERE p.name ILIKE $1
             GROUP BY pc.category
             ORDER BY count DESC`,
            [`%${search}%`]
        );

        res.json({ brands: brands.rows, categories: categories.rows });
    } catch (err: any) {
        console.error("FACETS DB ERROR:", err.message);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
