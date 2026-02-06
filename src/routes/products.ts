import { Router } from "express";
import { pool } from "../db/client";

const router = Router();

// GET /products?search=yogurt&brands=1,2&categories=5,7&page=1
router.get("/", async (req, res) => {
    const search = req.query.search?.toString() || "";
    const page = parseInt(req.query.page?.toString() || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    const brandsFilter: number[] = req.query.brands?.toString().split(",").map(Number) || [];
    const categoriesFilter: number[] = req.query.categories?.toString().split(",").map(Number) || [];

    try {
        const whereClauses: string[] = [`p.name ILIKE $1`];
        const values: any[] = [`%${search}%`];
        let idx = 2;

        if (brandsFilter.length > 0) {
            whereClauses.push(`p.brand_id = ANY($${idx}::bigint[])`);
            values.push(brandsFilter);
            idx++;
        }

        if (categoriesFilter.length > 0) {
            whereClauses.push(`pc.category_id = ANY($${idx}::bigint[])`);
            values.push(categoriesFilter);
            idx++;
        }

        const query = `
            SELECT DISTINCT p.*
            FROM products p
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""}
            ORDER BY p.name
            LIMIT $${idx} OFFSET $${idx + 1}
        `;

        values.push(limit, offset);

        const result = await pool.query(query, values);

        res.json({
            page,
            limit,
            total: result.rowCount,
            data: result.rows
        });
    } catch (err: any) {
        console.error("PRODUCTS DB ERROR:", err.message);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
