// routes/reports.js
import { Router } from "express";
import pool from "../db.js";

const router = Router();

/**
 * GET /api/reports/owners-summary?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns: [{ owner_id, owner_name, total_credit, total_debit, balance, last_activity }]
 */
router.get("/owners-summary", async (req, res) => {
  try {
    let { from, to } = req.query;

    const getToday = () => new Date().toISOString().slice(0, 10);

    // Default: today only
    if (!from && !to) {
      const today = getToday();
      from = today;
      to = today;
    } else if (!from && to) {
      from = to;
    } else if (from && !to) {
      to = from;
    }

    const result = await pool.query(
      `
      WITH credit AS (
        -- Credits from materials
        SELECT
          owner_id,
          COALESCE(SUM(total_cost), 0) AS total_credit,
          MAX(transaction_timestamp)    AS last_tx
        FROM transactions
        WHERE transaction_timestamp::date BETWEEN $1 AND $2
        GROUP BY owner_id

        UNION ALL

        -- Credits from passes
        SELECT
          owner_id,
          COALESCE(SUM(pass_amount), 0) AS total_credit,
          MAX(pass_date)    AS last_tx
        FROM owner_passes
        WHERE pass_date::date BETWEEN $1 AND $2
        GROUP BY owner_id
      ),
      credit_combined AS (
        SELECT
          owner_id,
          SUM(total_credit) AS total_credit,
          MAX(last_tx) AS last_tx
        FROM credit
        GROUP BY owner_id
      ),
      debit AS (
        SELECT
          owner_id,
          COALESCE(SUM(amount), 0) AS total_debit,
          MAX(payment_date)        AS last_pay
        FROM owner_payments
        WHERE payment_date::date BETWEEN $1 AND $2
        GROUP BY owner_id
      )
      SELECT
        vo.owner_id,
        vo.name AS owner_name,
        COALESCE(c.total_credit, 0) AS total_credit,
        COALESCE(d.total_debit, 0) AS total_debit,
        COALESCE(c.total_credit, 0) - COALESCE(d.total_debit, 0) AS balance,
        -- latest activity in this period (either last transaction or last payment)
        CASE
          WHEN c.last_tx IS NULL AND d.last_pay IS NULL THEN NULL
          WHEN c.last_tx IS NULL THEN d.last_pay
          WHEN d.last_pay IS NULL THEN c.last_tx
          ELSE GREATEST(c.last_tx, d.last_pay)
        END AS last_activity
      FROM vehicle_owners vo
      LEFT JOIN credit_combined c ON c.owner_id = vo.owner_id
      LEFT JOIN debit  d ON d.owner_id = vo.owner_id
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
