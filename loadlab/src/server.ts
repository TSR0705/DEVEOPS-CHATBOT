
import express from "express";
import { incrementRequest, getStats } from "./stats";
import { generateCPULoad } from "./load";
import { markOverloaded, clearOverloaded, isHealthy, isReady } from "./probes";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;


app.use(express.json());


app.post("/work", (req, res) => {
  incrementRequest();

  const durationMs = req.body.durationMs || 1000;

  markOverloaded();

  try {
    
    generateCPULoad(durationMs);

    
    clearOverloaded();

    
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

app.get("/stats", (req, res) => {
  incrementRequest();
  res.json(getStats());
});

app.get("/health", (req, res) => {
  incrementRequest();
  if (isHealthy()) {
    res.status(200).json({ status: "healthy" });
  } else {
    res.status(503).json({ status: "unhealthy" });
  }
});

app.get("/ready", (req, res) => {
  incrementRequest();
  if (isReady()) {
    res.status(200).json({ status: "ready" });
  } else {
    res.status(503).json({ status: "not ready" });
  }
});


app.listen(PORT, () => {
  console.log(`LoadLab server running on port ${PORT}`);
  console.log(`- Work endpoint: POST /work`);
  console.log(`- Stats endpoint: GET /stats`);
  console.log(`- Health endpoint: GET /health`);
  console.log(`- Readiness endpoint: GET /ready`);
});

export default app;
