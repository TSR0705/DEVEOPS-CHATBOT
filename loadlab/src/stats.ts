
const podName = process.env.HOSTNAME || "unknown-pod";

const startTime = Date.now();

let requestCount = 0;

export function incrementRequest(): void {
  requestCount++;
}

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
