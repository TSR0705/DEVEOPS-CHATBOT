// Kubernetes health probes for liveness and readiness
// Liveness: Is the process alive? (restart if not)
// Readiness: Is the service ready to accept traffic? (remove from load balancer if not)

let isOverloaded = false;

// Mark the service as overloaded (will affect readiness)
export function markOverloaded(): void {
  isOverloaded = true;
}

// Clear the overloaded state
export function clearOverloaded(): void {
  isOverloaded = false;
}

// Liveness probe - always returns healthy (process is alive)
export function isHealthy(): boolean {
  return true;
}

// Readiness probe - returns false when overloaded
// Kubernetes will stop sending traffic to this pod when not ready
export function isReady(): boolean {
  return !isOverloaded;
}
