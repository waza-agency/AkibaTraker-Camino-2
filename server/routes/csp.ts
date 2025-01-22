import { Router } from "express";
import { db } from "@db";
import { eq, desc } from "drizzle-orm";
import { cspViolations } from "@db/schema";

const router = Router();

// Endpoint to log CSP violations
router.post("/report", async (req, res) => {
  try {
    const violation = req.body;
    console.log("CSP Violation:", JSON.stringify(violation, null, 2));

    const [savedViolation] = await db.insert(cspViolations)
      .values({
        blockedUri: violation["blocked-uri"] || "",
        documentUri: violation["document-uri"] || "",
        violatedDirective: violation["violated-directive"] || "",
        originalPolicy: violation["original-policy"] || "",
        timestamp: new Date(),
      })
      .returning();

    res.status(201).json(savedViolation);
  } catch (error) {
    console.error("Error saving CSP violation:", error);
    res.status(500).json({ error: "Error saving CSP violation" });
  }
});

// Endpoint to get CSP violations for monitoring
router.get("/violations", async (_req, res) => {
  try {
    const violations = await db.query.cspViolations.findMany({
      orderBy: [desc(cspViolations.timestamp)],
      limit: 100
    });

    res.json(violations);
  } catch (error) {
    console.error("Error fetching CSP violations:", error);
    res.status(500).json({ error: "Error fetching CSP violations" });
  }
});

export default router;