// LoadLab server - Kubernetes behavior truth generator
// Exposes endpoints that demonstrate pod identity, uptime, and load handling

import express from "express";
import { incrementRequest, getStats } from "./stats";
import { generateCPULoad } from "./load";
import { markOverloaded, clearOverloaded, isHealthy, isReady } from "./probes";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Parse JSON bodies
app.use(express.json());

// POST /work - Generate CPU load and demonstrate readiness behavior
app.post("/work", (req, res) => {
  // Increment request counter before processing
  incrementRequest();

  // Extract duration from request body (default to 1000ms if not provided)
  const durationMs = req.body.durationMs || 1000;

  // Mark as overloaded (not ready for more traffic)
  markOverloaded();

  try {
    // Generate CPU load synchronously
    generateCPULoad(durationMs);

    // Clear overloaded status after work is done
    clearOverloaded();

    // Return success response
    res.json({
      message: `Work completed after ${durationMs}ms of CPU load`,
      stats: getStats(),
    });
  } catch (error) {
    // Clear overloaded status even if there's an error
    clearOverloaded();
    res.status(500).json({ error: "Work failed" });
  }
});

// GET /stats - Return pod identity and runtime metrics
app.get("/stats", (req, res) => {
  incrementRequest();
  res.json(getStats());
});

// GET /health - Liveness probe (is process alive?)
app.get("/health", (req, res) => {
  incrementRequest();
  if (isHealthy()) {
    res.status(200).json({ status: "healthy" });
  } else {
    res.status(503).json({ status: "unhealthy" });
  }
});

// GET /ready - Readiness probe (is service ready for traffic?)
app.get("/ready", (req, res) => {
  incrementRequest();
  if (isReady()) {
    res.status(200).json({ status: "ready" });
  } else {
    // Return 503 when not ready - Kubernetes will stop sending traffic
    res.status(503).json({ status: "not ready" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`LoadLab server running on port ${PORT}`);
  console.log(`- Work endpoint: POST /work`);
  console.log(`- Stats endpoint: GET /stats`);
  console.log(`- Health endpoint: GET /health`);
  console.log(`- Readiness endpoint: GET /ready`);
});

export default app;
