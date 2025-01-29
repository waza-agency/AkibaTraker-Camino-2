import { Router } from "express";
import { db } from "@db";

const router = Router();

// Endpoint to log CSP violations
router.post("/report", async (req, res) => {
  try {
    const violation = req.body;
    console.log("CSP Violation:", JSON.stringify(violation, null, 2));

    const result = await db.query(
      `INSERT INTO csp_violations 
       (blocked_uri, document_uri, violated_directive, original_policy, timestamp)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        violation["blocked-uri"] || "",
        violation["document-uri"] || "",
        violation["violated-directive"] || "",
        violation["original-policy"] || "",
        new Date(),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error saving CSP violation:", error);
    res.status(500).json({ error: "Error saving CSP violation" });
  }
});

// Endpoint to get CSP violations for monitoring
router.get("/violations", async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM csp_violations 
       ORDER BY timestamp DESC 
       LIMIT 100`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching CSP violations:", error);
    res.status(500).json({ error: "Error fetching CSP violations" });
  }
});

export default router;