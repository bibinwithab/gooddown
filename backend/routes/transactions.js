// routes/transactions.js
import { Router } from "express";
import pool from "../db.js";

const router = Router();

/**
 * POST /api/transactions
 * Body: { owner_id, material_id, vehicle_number, quantity }
 */
router.post("/", async (req, res) => {
  const { owner_id, material_id, vehicle_number, quantity } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) Get current rate from materials
    const materialResult = await client.query(
      "SELECT rate_per_unit FROM materials WHERE material_id = $1",
      [material_id]
    );

    if (materialResult.rowCount === 0) {
      throw new Error("Material not found");
    }

    const rate = materialResult.rows[0].rate_per_unit;
    const totalCost = Number(rate) * Number(quantity);

    // 2) Insert transaction
    const insertResult = await client.query(
      `INSERT INTO transactions (
          owner_id,
          material_id,
          vehicle_number,
          quantity,
          rate_at_sale,
          total_cost
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
      [owner_id, material_id, vehicle_number, quantity, rate, totalCost]
    );

    await client.query("COMMIT");

    // 3) Return data for bill generation (frontend can format print)
    res.status(201).json({
      message: "Transaction created successfully",
      transaction: insertResult.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to create transaction" });
  } finally {
    client.release();
  }
});

// GET /api/transactions/ledger/:ownerId
router.get("/ledger/:ownerId", async (req, res) => {
  const { ownerId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        t.transaction_timestamp,
        m.name AS material_name,
        m.rate_per_unit,
        t.vehicle_number,
        t.quantity,
        t.rate_at_sale,
        t.total_cost,
        SUM(t.total_cost) OVER (
          PARTITION BY t.owner_id
          ORDER BY t.transaction_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS cumulative_earnings
      FROM transactions t
      JOIN materials m ON t.material_id = m.material_id
      WHERE t.owner_id = $1
      ORDER BY t.transaction_timestamp ASC
      `,
      [ownerId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ledger" });
  }
});

export default router;
