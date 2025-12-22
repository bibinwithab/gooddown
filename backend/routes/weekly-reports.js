import { Router } from "express";
import pool from "../db.js";

const router = Router();

/**
 * Weekly / Period Ledger Report
 * Grouped by Owner → Date → Items
 */
router.get("/weekly-reports", async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: "from and to dates are required" });
  }

  try {
    /**
     * STEP 1: Get all ledger rows (credits + debits)
     */
    const { rows } = await pool.query(
      `
      WITH ledger AS (
        -- CREDITS (materials)
        SELECT
          t.owner_id,
          o.name AS owner_name,
          t.transaction_timestamp::date AS entry_date,
          'CREDIT' AS entry_type,
          m.name AS item_name,
          t.quantity,
          t.rate_at_sale,
          t.total_cost AS amount
        FROM transactions t
        JOIN materials m ON m.material_id = t.material_id
        JOIN vehicle_owners o ON o.owner_id = t.owner_id
        WHERE t.transaction_timestamp::date BETWEEN $1 AND $2

        UNION ALL

        -- CREDITS (passes)
        SELECT
          p.owner_id,
          o.name AS owner_name,
          p.pass_date::date AS entry_date,
          'CREDIT' AS entry_type,
          'PASS' AS item_name,
          NULL::numeric AS quantity,
          NULL::numeric AS rate_at_sale,
          p.pass_amount AS amount
        FROM owner_passes p
        JOIN vehicle_owners o ON o.owner_id = p.owner_id
        WHERE p.pass_date::date BETWEEN $1 AND $2

        UNION ALL

        -- DEBITS (payments)
        SELECT
          p.owner_id,
          o.name AS owner_name,
          p.payment_date::date AS entry_date,
          'DEBIT' AS entry_type,
          COALESCE(p.notes, 'PAID') AS item_name,
          NULL::numeric AS quantity,
          NULL::numeric AS rate_at_sale,
          p.amount AS amount
        FROM owner_payments p
        JOIN vehicle_owners o ON o.owner_id = p.owner_id
        WHERE p.payment_date::date BETWEEN $1 AND $2
      )
      SELECT *
      FROM ledger
      ORDER BY owner_name, entry_date, entry_type DESC
      `,
      [from, to]
    );

    /**
     * STEP 2: Build structured response
     */
    const result = {};
    const runningBalance = {};

    for (const r of rows) {
      const ownerId = r.owner_id;

      if (!result[ownerId]) {
        result[ownerId] = {
          owner_id: ownerId,
          owner_name: r.owner_name,
          dates: {},
        };
        runningBalance[ownerId] = 0;
      }

      if (!result[ownerId].dates[r.entry_date]) {
        result[ownerId].dates[r.entry_date] = {
          date: r.entry_date,
          items: [],
          day_total: 0,
          paid: 0,
          balance: 0,
        };
      }

      const day = result[ownerId].dates[r.entry_date];

      if (r.entry_type === "CREDIT") {
        day.items.push({
          material: r.item_name,
          qty: Number(r.quantity),
          rate: Number(r.rate_at_sale),
          total: Number(r.amount),
        });

        day.day_total += Number(r.amount);
        runningBalance[ownerId] += Number(r.amount);
      } else {
        day.items.push({
          material: "PAID",
          qty: "",
          rate: "",
          total: Number(r.amount),
        });

        day.paid += Number(r.amount);
        runningBalance[ownerId] -= Number(r.amount);
      }

      day.balance = runningBalance[ownerId];
    }

    /**
     * STEP 3: Convert object → array
     */
    const response = Object.values(result).map((owner) => ({
      owner_id: owner.owner_id,
      owner_name: owner.owner_name,
      entries: Object.values(owner.dates),
    }));

    res.json({
      from,
      to,
      owners: response,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate weekly ledger report" });
  }
});

export default router;
