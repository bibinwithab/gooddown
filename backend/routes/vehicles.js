// routes/vehicles.js
import express from "express";
import pool from "../db.js"; // adjust path

const router = express.Router();

/**
 * GET /api/vehicles?owner_id=1&q=TN
 * Returns recent vehicles for an owner
 */
router.get("/", async (req, res) => {
  const { owner_id, q = "" } = req.query;

  if (!owner_id) {
    return res.status(400).json({ error: "owner_id is required" });
  }

  try {
    const result = await pool.query(
      `
      SELECT vehicle_number
      FROM vehicles
      WHERE owner_id = $1
        AND vehicle_number ILIKE $2
      ORDER BY last_used_at DESC
      LIMIT 5
      `,
      [owner_id, `%${q}%`]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Vehicle fetch error:", err);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

router.post("/", async (req, res) => {
  const { owner_id, vehicle_number } = req.body;
  if (!owner_id || !vehicle_number) {
    return res
      .status(400)
      .json({ error: "owner_id and vehicle_number are required" });
  }
  try {
    const insertRes = await pool.query(
      `
      INSERT INTO vehicles (owner_id, vehicle_number, last_used_at)
        VALUES ($1, $2, NOW())
        RETURNING vehicle_id, vehicle_number
      `,
      [owner_id, vehicle_number]
    );
    res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    console.error("Vehicle insert error:", err);
    res.status(500).json({ error: "Failed to add vehicle" });
  }
});

export default router;
