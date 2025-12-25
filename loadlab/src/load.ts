// CPU load generator for Kubernetes behavior demonstration
// Synchronously burns CPU to simulate load

export function generateCPULoad(durationMs: number): void {
  const start = Date.now();
  // Synchronous CPU burn - blocks the event loop for durationMs
  while (Date.now() - start < durationMs) {
    // Busy wait - intentionally consumes CPU cycles
    // This creates actual load that Kubernetes can observe
  }
}