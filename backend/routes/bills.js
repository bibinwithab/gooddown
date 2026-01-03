// routes/bills.js
import { Router } from "express";
import pool from "../db.js";
import { generateBillPDF, getPDFPath } from "../utils/generateBillPDF.js";
import fs from "fs";
import path from "path";

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
        mattam: item.mattam || "",
        grillMattam: item.grillMattam || false,
        mattamChecked: item.mattamChecked || false,
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
            bill_id,
            mattam,
            grill_mattam,
            mattam_checked
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          li.owner_id,
          li.material_id,
          li.normalizedVehicle,
          li.quantity,
          li.rate_at_sale,
          li.total_cost,
          bill.bill_id,
          li.mattam,
          li.grillMattam,
          li.mattamChecked,
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

    // 6) Generate PDF
    try {
      const ownerRes = await pool.query(
        "SELECT name FROM vehicle_owners WHERE owner_id = $1",
        [owner_id]
      );
      const ownerName = ownerRes.rows[0]?.name || "Customer";

      const pdfData = {
        bill_id: bill.bill_id,
        daily_bill_no: bill.daily_bill_no,
        bill_timestamp: bill.bill_timestamp,
        owner_name: ownerName,
        vehicle_number: normalizedVehicle,
        items: insertedItems,
        total_amount: bill.total_amount,
        include_pass: include_pass || false,
      };

      const pdfResult = await generateBillPDF(pdfData);
    } catch (pdfErr) {
      console.error("PDF generation warning:", pdfErr.message);
      // Don't fail the entire request if PDF generation fails
    }

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

/**
 * GET /api/bills
 * Get all bills with optional filters
 */
router.get("/", async (req, res) => {
  const { owner_id, limit = 50, offset = 0 } = req.query;

  try {
    let query = `
      SELECT b.*, o.name as owner_name
      FROM bills b
      JOIN vehicle_owners o ON b.owner_id = o.owner_id
    `;
    const params = [];

    if (owner_id) {
      query += ` WHERE b.owner_id = $1`;
      params.push(owner_id);
    }

    query += ` ORDER BY b.bill_timestamp DESC LIMIT $${
      params.length + 1
    } OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching bills:", err);
    res.status(500).json({ error: "Failed to fetch bills" });
  }
});

/**
 * GET /api/bills/:billId
 * Get a specific bill with its items
 */
router.get("/:billId", async (req, res) => {
  const { billId } = req.params;

  try {
    const billRes = await pool.query(
      `SELECT b.*, o.name as owner_name
       FROM bills b
       JOIN vehicle_owners o ON b.owner_id = o.owner_id
       WHERE b.bill_id = $1`,
      [billId]
    );

    if (billRes.rows.length === 0) {
      return res.status(404).json({ error: "Bill not found" });
    }

    const bill = billRes.rows[0];

    const itemsRes = await pool.query(
      `SELECT t.*, m.name as material_name, m.unit
       FROM transactions t
       LEFT JOIN materials m ON t.material_id = m.material_id
       WHERE t.bill_id = $1`,
      [billId]
    );

    res.json({
      bill,
      items: itemsRes.rows,
    });
  } catch (err) {
    console.error("Error fetching bill:", err);
    res.status(500).json({ error: "Failed to fetch bill" });
  }
});

/**
 * GET /api/bills/:billId/download
 * Download bill PDF
 */
router.get("/:billId/download", async (req, res) => {
  const { billId } = req.params;

  try {
    const billRes = await pool.query(
      "SELECT daily_bill_no FROM bills WHERE bill_id = $1",
      [billId]
    );

    if (billRes.rows.length === 0) {
      return res.status(404).json({ error: "Bill not found" });
    }

    const daily_bill_no = billRes.rows[0].daily_bill_no;
    const pdfFilename = `bill_${billId}_${daily_bill_no}.pdf`;
    const filepath = getPDFPath(pdfFilename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: "PDF file not found" });
    }

    res.download(filepath, pdfFilename);
  } catch (err) {
    console.error("Error downloading bill:", err);
    res.status(500).json({ error: "Failed to download bill" });
  }
});

export default router;
