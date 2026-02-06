import { Router } from "express";
import { pool } from "../db/client";

const router = Router();

// GET /facets?search=yogurt&brands=1,2&categories=5,7
router.get("/", async (req, res) => {
    const search = req.query.search?.toString() || "";
    const brandsFilter: number[] = req.query.brands?.toString().split(",").map(Number) || [];
    const categoriesFilter: number[] = req.query.categories?.toString().split(",").map(Number) || [];

    try {
        // -------------------
        // Підрахунок брендів
        // -------------------
        const brandsQuery = `
            SELECT b.id, b.name, COUNT(p.id) AS count
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            WHERE p.name ILIKE $1
            ${categoriesFilter.length > 0 ? `AND pc.category_id = ANY($2::bigint[])` : ""}
            GROUP BY b.id, b.name
            ORDER BY count DESC
        `;

        const brandsValues: any[] = [`%${search}%`];
        if (categoriesFilter.length > 0) brandsValues.push(categoriesFilter);

        const brandsResult = await pool.query(brandsQuery, brandsValues);

        // -------------------
        // Підрахунок категорій
        // -------------------
        const categoriesQuery = `
            SELECT c.id, c.name, COUNT(p.id) AS count
            FROM products p
            JOIN product_categories pc ON p.id = pc.product_id
            JOIN categories c ON pc.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE p.name ILIKE $1
            ${brandsFilter.length > 0 ? `AND p.brand_id = ANY($2::bigint[])` : ""}
            GROUP BY c.id, c.name
            ORDER BY count DESC
        `;

        const categoriesValues: any[] = [`%${search}%`];
        if (brandsFilter.length > 0) categoriesValues.push(brandsFilter);

        const categoriesResult = await pool.query(categoriesQuery, categoriesValues);

        // -------------------
        // Відповідь
        // -------------------
        res.json({
            brands: brandsResult.rows,
            categories: categoriesResult.rows
        });
    } catch (err: any) {
        console.error("FACETS DB ERROR:", err.message);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
