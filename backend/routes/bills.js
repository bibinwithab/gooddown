// routes/bills.js
import { Router } from "express";
import pool from "../db.js";

const router = Router();

/**
 * POST /api/bills
 * Body:
 * {
 *   owner_id,
 *   vehicle_number,
 *   items: [
 *     { material_id, quantity },
 *     ...
 *   ]
 * }
 */
router.post("/", async (req, res) => {
  const { owner_id, vehicle_number, items } = req.body;

  if (
    !owner_id ||
    !vehicle_number ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res
      .status(400)
      .json({
        error: "owner_id, vehicle_number and at least one item are required",
      });
  }

  const normalizedVehicle = vehicle_number
  .toUpperCase()
  .replace(/\s+/g, "")
  .replace(/--+/g, "-");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) Get all material rates in one query
    const materialIds = items.map((it) => it.material_id);
    const materialRes = await client.query(
      `SELECT material_id, rate_per_unit
       FROM materials
       WHERE material_id = ANY($1::int[])`,
      [materialIds]
    );

    const rateMap = new Map();
    for (const row of materialRes.rows) {
      rateMap.set(row.material_id, Number(row.rate_per_unit));
    }

    let billTotal = 0;
    const lineItems = [];

    for (const item of items) {
      const qty = Number(item.quantity);
      const rate = rateMap.get(item.material_id);

      if (!rate || !qty || qty <= 0) {
        throw new Error("Invalid material or quantity");
      }

      const lineTotal = rate * qty;
      billTotal += lineTotal;

      lineItems.push({
        owner_id,
        material_id: item.material_id,
        normalizedVehicle,
        quantity: qty,
        rate_at_sale: rate,
        total_cost: lineTotal,
      });
    }

    // 2) Insert bill header
    const billResult = await client.query(
      `INSERT INTO bills (owner_id, vehicle_number, total_amount)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [owner_id, normalizedVehicle, billTotal]
    );

    const bill = billResult.rows[0];

    // 3) Insert all items into transactions linked to this bill
    const insertedItems = [];
    for (const li of lineItems) {
      const itemRes = await client.query(
        `INSERT INTO transactions (
            owner_id,
            material_id,
            vehicle_number,
            quantity,
            rate_at_sale,
            total_cost,
            bill_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          li.owner_id,
          li.material_id,
          li.normalizedVehicle,
          li.quantity,
          li.rate_at_sale,
          li.total_cost,
          bill.bill_id,
        ]
      );
      insertedItems.push(itemRes.rows[0]);
    }

    await pool.query(
      `
  INSERT INTO vehicles (owner_id, vehicle_number)
  VALUES ($1, $2)
  ON CONFLICT (owner_id, vehicle_number)
  DO UPDATE SET last_used_at = NOW()
  `,
      [owner_id, normalizedVehicle]
    );

    await client.query("COMMIT");

    // 4) Return data for bill print
    res.status(201).json({
      message: "Bill created successfully",
      bill,
      items: insertedItems,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to create bill" });
  } finally {
    client.release();
  }
});

export default router;
