import { Router } from "express";
import { pool } from "../db/client";

const router = Router();

// GET /products?search=yogurt&brands=1,2&categories=5,7&page=1
router.get("/", async (req, res) => {
    const search = req.query.search?.toString() || "";
    const page = parseInt(req.query.page?.toString() || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    // Фільтри (масиви чисел)
    const brands = req.query.brands?.toString().split(",").map(Number) || [];
    const categories = req.query.categories?.toString().split(",").map(Number) || [];

    try {
        // SQL умовні частини
        const whereClauses: string[] = [`p.name ILIKE $1`];
        const values: any[] = [`%${search}%`];
        let idx = 2; // для параметрів $2, $3 і т.д.

        if (brands.length > 0) {
            whereClauses.push(`p.brand_id = ANY($${idx}::bigint[])`);
            values.push(brands);
            idx++;
        }

        if (categories.length > 0) {
            whereClauses.push(`pc.category_id = ANY($${idx}::bigint[])`);
            values.push(categories);
            idx++;
        }

        // SQL з LEFT JOIN на product_categories
        const query = `
            SELECT DISTINCT p.*
            FROM products p
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            WHERE ${whereClauses.join(" AND ")}
            ORDER BY p.name
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        values.push(limit, offset);

        const result = await pool.query(query, values);

        // Підрахунок загальної кількості (без LIMIT/OFFSET)
        const countQuery = `
            SELECT COUNT(DISTINCT p.id) AS total
            FROM products p
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            WHERE ${whereClauses.join(" AND ")}
        `;
        const countResult = await pool.query(countQuery, values.slice(0, idx - 1));
        const total = parseInt(countResult.rows[0].total);

        res.json({
            page,
            limit,
            total,
            data: result.rows,
        });
    } catch (err: any) {
        console.error("DB ERROR:", err.message);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
