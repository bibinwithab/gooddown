// routes/reports.js
import { Router } from "express";
import pool from "../db.js";

const router = Router();

/**
 * GET /api/reports/owners-summary?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns: [{ owner_id, owner_name, total_payable }]
 */
router.get("/owners-summary", async (req, res) => {
  try {
    let { from, to } = req.query;

    // Helper: get today's date in YYYY-MM-DD (local time)
    const getToday = () => new Date().toISOString().slice(0, 10);

    // 👇 Default behaviour: DAILY report for today
    if (!from && !to) {
      const today = getToday();
      from = today;
      to = today;
    } else if (!from && to) {
      // only "to" provided → use same day
      from = to;
    } else if (from && !to) {
      // only "from" provided → use same day
      to = from;
    }

    const result = await pool.query(
      `
      SELECT
        vo.owner_id,
        vo.name AS owner_name,
        COALESCE(SUM(t.total_cost), 0) AS total_payable
      FROM vehicle_owners vo
      LEFT JOIN transactions t
        ON t.owner_id = vo.owner_id
       AND t.transaction_timestamp::date BETWEEN $1 AND $2
      GROUP BY vo.owner_id, vo.name
      ORDER BY vo.name ASC
      `,
      [from, to]
    );

    res.json({
      from,
      to,
      owners: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch owner accounts summary" });
  }
});

export default router;
