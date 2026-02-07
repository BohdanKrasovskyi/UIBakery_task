import { Router } from "express";
import { pool } from "../db/client";

const router = Router();

// GET /products?search=yogurt&brands=1,2&categories=2,5&page=1
router.get("/", async (req, res) => {
    const search = req.query.search?.toString() || "";
    const parseIdList = (value: unknown): number[] =>
        value
            ? value
                  .toString()
                  .split(",")
                  .map((entry) => Number(entry))
                  .filter((entry) => Number.isFinite(entry) && entry > 0)
            : [];
    const brandsFilter = parseIdList(req.query.brands);
    const categoriesFilter = parseIdList(req.query.categories);
    const page = Math.max(parseInt(req.query.page?.toString() || "1"), 1);
    const limit = 20;
    const offset = (page - 1) * limit;

    try {
        let whereClauses: string[] = [`p.name ILIKE $1`];
        let values: any[] = [`%${search}%`];
        let idx = 2;

        if (brandsFilter.length > 0) {
            whereClauses.push(`p.brand_id = ANY($${idx}::bigint[])`);
            values.push(brandsFilter);
            idx++;
        }

        let joinCategories = "";
        if (categoriesFilter.length > 0) {
            joinCategories = `JOIN product_categories pc ON p.id = pc.product_id`;
            whereClauses.push(`pc.category_id = ANY($${idx}::bigint[])`);
            values.push(categoriesFilter);
            idx++;
        }

        const countQuery = `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM products p
      ${joinCategories}
      WHERE ${whereClauses.join(" AND ")}
    `;

        const countResult = await pool.query(countQuery, values);

        const query = `
      SELECT DISTINCT p.*
      FROM products p
      ${joinCategories}
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY p.name
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
        values.push(limit, offset);

        const result = await pool.query(query, values);

        res.json({
            page,
            limit,
            total: Number(countResult.rows[0]?.total || 0),
            data: result.rows
        });
    } catch (err: any) {
        console.error("DB ERROR:", err.message);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;
