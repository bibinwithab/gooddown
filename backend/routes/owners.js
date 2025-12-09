// routes/owners.js
import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET all owners
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM vehicle_owners WHERE is_active = TRUE ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch vehicle owners" });
  }
});

// POST create owner
router.post("/", async (req, res) => {
  const { name, contact_info } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO vehicle_owners (name, contact_info)
       VALUES ($1, $2)
       RETURNING *`,
      [name, contact_info]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create vehicle owner" });
  }
});

// UPDATE owner
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, contact_info, is_active } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE vehicle_owners
      SET
        name = $1,
        contact_info = $2,
        is_active = COALESCE($3, is_active),
        updated_at = NOW()
      WHERE owner_id = $4
      RETURNING *
      `,
      [name, contact_info, is_active, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Owner not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "Another owner already has this name" });
    }
    res.status(500).json({ error: "Failed to update owner" });
  }
});

router.patch("/:id/active", async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE vehicle_owners
      SET is_active = $1, updated_at = NOW()
      WHERE owner_id = $2
      RETURNING *
      `,
      [is_active, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Owner not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update owner status" });
  }
});

export default router;
