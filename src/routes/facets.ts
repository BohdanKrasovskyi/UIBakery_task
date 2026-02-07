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

// GET /facets?search=yogurt&brands=1,2&categories=5,7
router.get("/", async (req, res) => {
    const search = req.query.search?.toString() || "";
    const brandsFilter = parseIdList(req.query.brands);
    const categoriesFilter = parseIdList(req.query.categories);

    try {
        // ---------------- COMMON WHERE ----------------
        const baseWhere: string[] = ["p.name ILIKE $1"];
        const baseValues: any[] = [`%${search}%`];
        let idx = 2;

        let joinCategories = "";
        if (categoriesFilter.length > 0) {
            joinCategories = "JOIN product_categories pc ON p.id = pc.product_id";
            baseWhere.push(`pc.category_id = ANY($${idx}::bigint[])`);
            baseValues.push(categoriesFilter);
            idx++;
        }

        if (brandsFilter.length > 0) {
            baseWhere.push(`p.brand_id = ANY($${idx}::bigint[])`);
            baseValues.push(brandsFilter);
            idx++;
        }

        const whereSQL = baseWhere.join(" AND ");

        // ---------------- BRANDS FACET ----------------
        const brandsQuery = `
            SELECT b.id, b.name, COUNT(DISTINCT p.id) AS count
            FROM products p
            JOIN brands b ON p.brand_id = b.id
            ${joinCategories}
            WHERE ${whereSQL}
            GROUP BY b.id, b.name
            ORDER BY count DESC
        `;
        const brandsResult = await pool.query(brandsQuery, baseValues);

        // ---------------- CATEGORIES FACET ----------------
        const categoriesQuery = `
            SELECT c.id, c.name, COUNT(DISTINCT p.id) AS count
            FROM products p
            JOIN product_categories pc ON p.id = pc.product_id
            JOIN categories c ON pc.category_id = c.id
            WHERE ${whereSQL}
            GROUP BY c.id, c.name
            ORDER BY count DESC
        `;
        const categoriesResult = await pool.query(categoriesQuery, baseValues);

        res.json({
            brands: brandsResult.rows,
            categories: categoriesResult.rows,
        });
    } catch (err) {
        console.error("FACETS ERROR:", err);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
