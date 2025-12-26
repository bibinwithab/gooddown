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
 *   ],
 *   include_pass: boolean (optional, default false)
 * }
 */
router.post("/", async (req, res) => {
  const { owner_id, vehicle_number, items, include_pass } = req.body;

  if (
    !owner_id ||
    !vehicle_number ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
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

    // Add pass amount to bill total if include_pass is true
    const PASS_AMOUNT = 200;
    if (include_pass) {
      billTotal += PASS_AMOUNT;
    }

    // 2) Get daily bill number - count bills created today
    // Use PostgreSQL's timezone-aware date calculation
    const dailyCountRes = await client.query(
      `SELECT COUNT(*) as count FROM bills 
       WHERE DATE(bill_timestamp AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE AT TIME ZONE 'Asia/Kolkata'`
    );

    const dailyBillNumber = parseInt(dailyCountRes.rows[0].count) + 1;

    // Insert bill header
    const billResult = await client.query(
      `INSERT INTO bills (owner_id, vehicle_number, total_amount, daily_bill_no)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [owner_id, normalizedVehicle, billTotal, dailyBillNumber]
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

    // 4) Insert pass charge if include_pass is true
    let passRecord = null;
    if (include_pass) {
      const PASS_AMOUNT = 200;
      const passRes = await client.query(
        `INSERT INTO owner_passes (owner_id, vehicle_number, pass_amount, bill_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [owner_id, normalizedVehicle, PASS_AMOUNT, bill.bill_id]
      );
      passRecord = passRes.rows[0];
    }

    await client.query(
      `
      INSERT INTO vehicles (owner_id, vehicle_number)
      VALUES ($1, $2)
      ON CONFLICT (owner_id, vehicle_number)
      DO UPDATE SET last_used_at = NOW()
      `,
      [owner_id, normalizedVehicle]
    );

    await client.query("COMMIT");

    // 5) Return data for bill print
    res.status(201).json({
      message: "Bill created successfully",
      bill,
      items: insertedItems,
      pass: passRecord,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[BILLS] Error creating bill:", err.message, err.stack);
    console.error("[BILLS] Request body:", {
      owner_id,
      vehicle_number,
      items_count: items.length,
      include_pass,
    });
    res.status(500).json({
      error: "Failed to create bill",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  } finally {
    client.release();
  }
});

export default router;
