// routes/ledger.js
import { Router } from "express";
import pool from "../db.js";

const router = Router();

/**
 * GET /api/owners/:ownerId/ledger
 * Returns ledger with correct running balance
 * Latest transaction comes FIRST in response
 */
router.get("/owners/:ownerId/ledger", async (req, res) => {
  const { ownerId } = req.params;

  try {
    const result = await pool.query(
      `
      WITH ledger_base AS (
        -- Credits: material transactions
        SELECT
          t.transaction_id             AS id,
          t.transaction_timestamp      AS entry_date,
          'CREDIT'                     AS entry_type,
          m.name                       AS material_name,
          t.vehicle_number,
          t.quantity,
          t.rate_at_sale,
          t.total_cost                 AS amount
        FROM transactions t
        JOIN materials m
          ON m.material_id = t.material_id
        WHERE t.owner_id = $1

        UNION ALL

        -- Credits: pass charges
        SELECT
          p.pass_id                    AS id,
          p.pass_date                  AS entry_date,
          'CREDIT'                     AS entry_type,
          'PASS'                       AS material_name,
          p.vehicle_number,
          NULL::numeric                AS quantity,
          NULL::numeric                AS rate_at_sale,
          p.pass_amount                AS amount
        FROM owner_passes p
        WHERE p.owner_id = $1

        UNION ALL

        -- Debits: payments
        SELECT
          p.payment_id                 AS id,
          p.payment_date               AS entry_date,
          'DEBIT'                      AS entry_type,
          COALESCE(p.notes, 'Payment') AS material_name,
          NULL::varchar                AS vehicle_number,
          NULL::numeric                AS quantity,
          NULL::numeric                AS rate_at_sale,
          p.amount                     AS amount
        FROM owner_payments p
        WHERE p.owner_id = $1
      ),

      ledger_with_balance AS (
        SELECT
          entry_date,
          entry_type,
          material_name,
          vehicle_number,
          quantity,
          rate_at_sale,
          amount,
          CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END AS credit_amount,
          CASE WHEN entry_type = 'DEBIT'  THEN amount ELSE 0 END AS debit_amount,

          -- ✅ RUNNING BALANCE (OLD → NEW)
          SUM(
            CASE
              WHEN entry_type = 'CREDIT' THEN amount
              ELSE -amount
            END
          ) OVER (
            ORDER BY entry_date ASC, entry_type DESC, id ASC
          ) AS balance

        FROM ledger_base
      )

      -- ✅ FINAL OUTPUT: OLD → NEW (oldest first, latest last)
      SELECT *
      FROM ledger_with_balance
      ORDER BY entry_date ASC, entry_type ASC;
      `,
      [ownerId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ledger" });
  }
});

/**
 * POST /api/owners/:ownerId/payments
 */
router.post("/owners/:ownerId/payments", async (req, res) => {
  const { ownerId } = req.params;
  const { amount, mode, notes, payment_date } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: "Valid amount is required" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO owner_payments (owner_id, amount, mode, notes, payment_date)
      VALUES ($1, $2, $3, $4, COALESCE($5, NOW()))
      RETURNING *
      `,
      [
        ownerId,
        Number(amount),
        mode || null,
        notes || null,
        payment_date || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to record payment" });
  }
});

export default router;
