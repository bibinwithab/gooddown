// routes/materials.js
import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET all materials
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM materials WHERE is_active = TRUE ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
});

// POST create material
router.post("/", async (req, res) => {
  const { name, rate_per_unit, unit } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO materials (name, rate_per_unit, unit)
       VALUES ($1, $2, COALESCE($3, 'ton'))
       RETURNING *`,
      [name, rate_per_unit, unit]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create material" });
  }
});

// UPDATE material (name, rate, unit, is_active)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, rate_per_unit, unit, is_active } = req.body;

  if (!name || rate_per_unit == null || !unit) {
    return res
      .status(400)
      .json({ error: "name, rate_per_unit and unit are required" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE materials
      SET
        name = $1,
        rate_per_unit = $2,
        unit = $3,
        is_active = COALESCE($4, is_active),
        updated_at = NOW()
      WHERE material_id = $5
      RETURNING *
      `,
      [name, rate_per_unit, unit, is_active, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Material not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    // Unique name conflict
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "Another material already has this name" });
    }
    res.status(500).json({ error: "Failed to update material" });
  }
});

export default router;
