// System truth tracker for Kubernetes behavior demonstration
// Captures pod identity and runtime metrics

// Capture podName from environment (will be unique per pod)
const podName = process.env.HOSTNAME || "unknown-pod";

// Track start time for uptime calculation
const startTime = Date.now();

// Track request count
let requestCount = 0;

// Increment request counter
export function incrementRequest(): void {
  requestCount++;
}

// Get current stats including pod identity and uptime
export function getStats(): {
  podName: string;
  uptimeMs: number;
  requestCount: number;
} {
  const uptimeMs = Date.now() - startTime;
  return {
    podName,
    uptimeMs,
    requestCount,
  };
}
