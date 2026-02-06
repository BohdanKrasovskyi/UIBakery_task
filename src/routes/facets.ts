import { Router } from "express";
import { pool } from "../db/client"; // твій файл підключення до Supabase/Postgres

const router = Router();

// GET /facets?search=apple
router.get("/", async (req, res) => {
    const search = req.query.search?.toString() || "";

    try {
        // Підрахунок брендів
        const brands = await pool.query(
            `SELECT b.name, COUNT(p.id) as count
       FROM products p
       JOIN brands b ON p.brand_id = b.id
       WHERE p.product_name ILIKE $1
       GROUP BY b.name
       ORDER BY count DESC`,
            [`%${search}%`]
        );

        // Підрахунок категорій
        const categories = await pool.query(
            `SELECT c.name, COUNT(pc.product_id) as count
       FROM products p
       JOIN product_categories pc ON p.id = pc.product_id
       JOIN categories c ON pc.category_id = c.id
       WHERE p.product_name ILIKE $1
       GROUP BY c.name
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
