import { Router } from "express";
import { pool } from "../db/client";

const router = Router();

const parseIdList = (value: unknown): number[] => {
    if (!value) return [];
    const raw = Array.isArray(value) ? value.join(",") : value.toString();
    return raw
        .split(",")
        .map(v => Number(v.trim()))
        .filter(Number.isFinite);
};

// GET /products?search=yogurt&brands=1,2&categories=2,5&page=1
router.get("/", async (req, res) => {
    const search = req.query.search?.toString() || "";
    const brandsFilter = parseIdList(req.query.brands);
    const categoriesFilter = parseIdList(req.query.categories);

    const page = Math.max(1, parseInt(req.query.page?.toString() || "1"));
    const limit = 20;
    const offset = (page - 1) * limit;

    try {
        const where: string[] = ["p.name ILIKE $1"];
        const values: any[] = [`%${search}%`];
        let idx = 2;

        let joinCategories = "";
        if (categoriesFilter.length > 0) {
            joinCategories = "JOIN product_categories pc ON p.id = pc.product_id";
            where.push(`pc.category_id = ANY($${idx}::bigint[])`);
            values.push(categoriesFilter);
            idx++;
        }

        if (brandsFilter.length > 0) {
            where.push(`p.brand_id = ANY($${idx}::bigint[])`);
            values.push(brandsFilter);
            idx++;
        }

        const whereSQL = where.join(" AND ");


        const countQuery = `
            SELECT COUNT(DISTINCT p.id) AS total
            FROM products p
            ${joinCategories}
            WHERE ${whereSQL}
        `;
        const countResult = await pool.query(countQuery, values);
        const total = Number(countResult.rows[0].total);

        const dataQuery = `
            SELECT DISTINCT p.*
            FROM products p
            ${joinCategories}
            WHERE ${whereSQL}
            ORDER BY p.name
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...values, limit, offset]);

        res.json({
            page,
            limit,
            total,
            data: dataResult.rows,
        });
    } catch (err) {
        console.error("PRODUCTS ERROR:", err);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
