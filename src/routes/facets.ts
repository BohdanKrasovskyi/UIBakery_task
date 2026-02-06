import { Router } from "express";
import { pool } from "../db/client"; // твій файл підключення до Supabase/Postgres

const router = Router();

router.get("/", async (req, res) => {
    const search = req.query.search?.toString() || "";

    try {
        const brands = await pool.query(
            `SELECT b.name, COUNT(p.id) AS count
       FROM products p
       JOIN brands b ON p.brand_id = b.id
       WHERE p.name ILIKE $1
       GROUP BY b.name
       ORDER BY count DESC`,
            [`%${search}%`]
        );

        // Підрахунок категорій
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
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
