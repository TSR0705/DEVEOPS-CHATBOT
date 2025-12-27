/**
 * PHASE 3.4 — KUBERNETES EXECUTION ADAPTER
 * 
 * This is the ONLY place in the entire codebase where Kubernetes is mutated.
 * 
 * WHY A THIN INTERFACE LIMITS BLAST RADIUS:
 * - Only 3 methods exposed = only 3 possible mutation paths
 * - Any Kubernetes bug is contained to this single file
 * - Security audit scope is minimal and focused
 * 
 * WHY HARD-CODING NAMESPACE AND DEPLOYMENT IS SAFER:
 * - Prevents namespace escape attacks (user cannot target "kube-system")
 * - Prevents targeting arbitrary deployments (user cannot scale "nginx")
 * - Eliminates configuration injection vulnerabilities
 * - Makes behavior 100% deterministic and auditable
 * 
 * SECURITY BOUNDARY:
 * - No other file should import @kubernetes/client-node
 * - All Kubernetes mutations MUST go through this adapter
 * - Worker calls adapter → adapter calls K8s API → done
 */

import * as k8s from "@kubernetes/client-node";

// ═══════════════════════════════════════════════════════════════════════════
// HARD-CODED CONSTANTS (SECURITY CRITICAL)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * NAMESPACE is hard-coded to "demo".
 * This prevents namespace escape attacks.
 * A user cannot target "default", "kube-system", or any other namespace.
 */
const NAMESPACE = "demo";

/**
 * DEPLOYMENT_NAME is hard-coded to "loadlab".
 * This prevents targeting arbitrary deployments.
 * A user cannot scale or restart any other deployment.
 */
const DEPLOYMENT_NAME = "loadlab";

/**
 * REPLICA LIMITS for safety.
 * WHY REPLICA CAPS ARE MANDATORY:
 * - MIN = 1: Prevents scaling to zero (denial of service)
 * - MAX = 5: Prevents resource exhaustion attacks
 * - These are hard limits, not suggestions
 */
const MIN_REPLICAS = 1;
const MAX_REPLICAS = 5;

// ═══════════════════════════════════════════════════════════════════════════
// K8sExecutor INTERFACE (LOCKED — DO NOT MODIFY)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * K8sExecutor — The ONLY interface for Kubernetes mutations.
 * 
 * This interface is intentionally minimal:
 * - scaleDeployment: Change replica count (within limits)
 * - restartDeployment: Trigger rolling restart (no downtime)
 * - getStatus: Read-only status fetch (for READ/DRY_RUN)
 */
export interface K8sExecutor {
  scaleDeployment(replicas: number): Promise<void>;
  restartDeployment(): Promise<void>;
  getStatus(): Promise<K8sStatus>;
}

/**
 * K8sStatus — Read-only status information.
 * Used by getStatus() for READ and DRY_RUN commands.
 */
export interface K8sStatus {
  replicas: number;
  readyReplicas: number;
  pods: Array<{
    name: string;
    startTime: string | null;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// K8sClient IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * K8sClient — Concrete implementation of K8sExecutor.
 * 
 * This class:
 * - Loads kubeconfig (in-cluster or default)
 * - Provides scaleDeployment, restartDeployment, getStatus
 * - Hard-codes namespace and deployment name
 * - Validates all inputs before API calls
 * - Throws on any failure (no silent errors)
 */
export class K8sClient implements K8sExecutor {
  private appsApi: k8s.AppsV1Api;
  private coreApi: k8s.CoreV1Api;

  constructor() {
    const kc = new k8s.KubeConfig();

    /**
     * Load kubeconfig:
     * - In-cluster: Uses service account mounted at /var/run/secrets/kubernetes.io/serviceaccount
     * - Default: Uses ~/.kube/config
     * 
     * FAIL LOUDLY if config is missing.
     * No fallbacks. No mocking. No silent failures.
     */
    try {
      kc.loadFromDefault();
    } catch (error) {
      throw new Error(
        "FATAL: Cannot load Kubernetes config. " +
        "Ensure kubeconfig exists or running in-cluster. " +
        `Original error: ${error}`
      );
    }

    this.appsApi = kc.makeApiClient(k8s.AppsV1Api);
    this.coreApi = kc.makeApiClient(k8s.CoreV1Api);
  }

  /**
   * scaleDeployment — Scale the LoadLab deployment to specified replicas.
   * 
   * VALIDATION:
   * - replicas must be an integer
   * - replicas must be >= MIN_REPLICAS (1)
   * - replicas must be <= MAX_REPLICAS (5)
   * 
   * WHY REPLICA CAPS ARE MANDATORY:
   * - Scaling to 0 = denial of service (no pods to handle requests)
   * - Scaling to 100 = resource exhaustion (cluster overload)
   * - Limits are security boundaries, not convenience features
   * 
   * BEHAVIOR:
   * - Patch deployment spec.replicas
   * - Await Kubernetes API response
   * - Throw on any failure
   * - Return void on success
   * 
   * NO RETRIES:
   * - If API fails, throw immediately
   * - Worker catches error, releases mutex, continues
   * - Retries could cause cascading failures during outages
   */
  async scaleDeployment(replicas: number): Promise<void> {
    // VALIDATION: Must be integer
    if (!Number.isInteger(replicas)) {
      throw new Error(
        `Invalid replica count: ${replicas}. Must be an integer.`
      );
    }

    // VALIDATION: Must be within bounds
    if (replicas < MIN_REPLICAS || replicas > MAX_REPLICAS) {
      throw new Error(
        `Invalid replica count: ${replicas}. ` +
        `Must be between ${MIN_REPLICAS} and ${MAX_REPLICAS}.`
      );
    }

    // Patch the deployment
    const patch = {
      spec: {
        replicas: replicas,
      },
    };

    try {
      await this.appsApi.patchNamespacedDeployment({
        name: DEPLOYMENT_NAME,
        namespace: NAMESPACE,
        body: patch,
      });
    } catch (error) {
      // No retry. Throw immediately.
      throw new Error(
        `Failed to scale deployment ${DEPLOYMENT_NAME} to ${replicas} replicas. ` +
        `Error: ${error}`
      );
    }
  }

  /**
   * restartDeployment — Trigger a rolling restart of the LoadLab deployment.
   * 
   * WHY ANNOTATION-BASED RESTART IS SAFER THAN POD DELETION:
   * - Annotation patch triggers Kubernetes rolling update
   * - Kubernetes respects PodDisruptionBudget and rolling strategy
   * - Old pods are only terminated after new pods are ready
   * - Manual pod deletion causes immediate termination (potential downtime)
   * - Annotation method is the standard "kubectl rollout restart" approach
   * 
   * BEHAVIOR:
   * - Patch pod template annotation with current timestamp
   * - Kubernetes detects template change → initiates rolling update
   * - Throw on any failure
   * - Return void on success
   */
  async restartDeployment(): Promise<void> {
    const patch = {
      spec: {
        template: {
          metadata: {
            annotations: {
              "kubectl.kubernetes.io/restartedAt": new Date().toISOString(),
            },
          },
        },
      },
    };

    try {
      await this.appsApi.patchNamespacedDeployment({
        name: DEPLOYMENT_NAME,
        namespace: NAMESPACE,
        body: patch,
      });
    } catch (error) {
      // No retry. Throw immediately.
      throw new Error(
        `Failed to restart deployment ${DEPLOYMENT_NAME}. ` +
        `Error: ${error}`
      );
    }
  }

  /**
   * getStatus — Fetch read-only status of the LoadLab deployment.
   * 
   * This method is READ-ONLY. It does NOT mutate anything.
   * Used for READ and DRY_RUN commands.
   * 
   * RETURNS:
   * - replicas: Desired replica count
   * - readyReplicas: Currently ready replicas
   * - pods: Array of pod names and start times
   * 
   * NO CACHING:
   * - Always fetches fresh data from Kubernetes API
   * - No stale data
   * - No aggregation magic
   */
  async getStatus(): Promise<K8sStatus> {
    try {
      // Fetch deployment
      const deploymentResponse = await this.appsApi.readNamespacedDeployment({
        name: DEPLOYMENT_NAME,
        namespace: NAMESPACE,
      });

      const deployment = deploymentResponse;
      const replicas = deployment.spec?.replicas ?? 0;
      const readyReplicas = deployment.status?.readyReplicas ?? 0;

      // Fetch pods matching the deployment's selector
      const labelSelector = `app=${DEPLOYMENT_NAME}`;
      const podsResponse = await this.coreApi.listNamespacedPod({
        namespace: NAMESPACE,
        labelSelector: labelSelector,
      });

      const pods = podsResponse.items.map((pod) => ({
        name: pod.metadata?.name ?? "unknown",
        startTime: pod.status?.startTime?.toISOString() ?? null,
      }));

      return {
        replicas,
        readyReplicas,
        pods,
      };
    } catch (error) {
      throw new Error(
        `Failed to get status for deployment ${DEPLOYMENT_NAME}. ` +
        `Error: ${error}`
      );
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Singleton K8s executor instance.
 * 
 * Only ONE instance should exist in the entire application.
 * Worker imports this and calls methods.
 * No other file should create K8sClient instances.
 */
let executor: K8sExecutor | null = null;

/**
 * getK8sExecutor — Get the singleton K8sExecutor instance.
 * 
 * Lazy initialization: Client is created on first call.
 * Subsequent calls return the same instance.
 */
export function getK8sExecutor(): K8sExecutor {
  if (!executor) {
    executor = new K8sClient();
  }
  return executor;
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * TEST SCENARIOS — BEHAVIOR DOCUMENTATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * TEST 1 — VALID SCALING
 * ──────────────────────
 * Input: scale to 3
 * 
 * Expected Behavior:
 * 1. scaleDeployment(3) called
 * 2. Validation passes (3 is integer, 1 <= 3 <= 5)
 * 3. Patch sent: { spec: { replicas: 3 } }
 * 4. Kubernetes API responds 200 OK
 * 5. Method returns void
 * 6. Worker continues to next command
 * 
 * Result: Deployment now has 3 replicas.
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * TEST 2 — INVALID REPLICA COUNT
 * ──────────────────────────────
 * Input: scale to 0 OR scale to 10
 * 
 * Expected Behavior:
 * 1. scaleDeployment(0) or scaleDeployment(10) called
 * 2. Validation FAILS:
 *    - 0 < MIN_REPLICAS (1) → Error
 *    - 10 > MAX_REPLICAS (5) → Error
 * 3. Error thrown IMMEDIATELY (before API call)
 * 4. No Kubernetes mutation occurs
 * 5. Worker catches error in try block
 * 6. Mutex released in finally block
 * 7. Worker continues to next command
 * 
 * Result: Cluster unchanged. Error logged. System continues.
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * TEST 3 — RESTART SAFETY
 * ───────────────────────
 * Input: restartDeployment()
 * 
 * Expected Behavior:
 * 1. Annotation patch sent with current timestamp
 * 2. Kubernetes detects template change
 * 3. Rolling update initiated:
 *    - New pods created
 *    - New pods become ready
 *    - Old pods terminated (one at a time)
 * 4. No immediate pod deletion
 * 5. Kubernetes respects maxUnavailable/maxSurge
 * 
 * Result: Pods restart gracefully. No downtime beyond normal K8s behavior.
 * 
 * WHY NOT DELETE PODS:
 * - Deleting pods = immediate termination
 * - In-flight requests are dropped
 * - If all pods deleted simultaneously = total outage
 * - Annotation method = controlled rolling restart
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * TEST 4 — KUBERNETES API FAILURE
 * ───────────────────────────────
 * Scenario: API temporarily unavailable (network issue, API server down)
 * 
 * Expected Behavior:
 * 1. scaleDeployment() or restartDeployment() called
 * 2. API call throws error
 * 3. Error is caught and re-thrown with context
 * 4. NO RETRY (this is critical)
 * 5. Worker catches error
 * 6. Mutex released in finally block
 * 7. Command marked as failed
 * 8. Worker continues to next command
 * 
 * WHY NO RETRIES IS SAFER:
 * - If API is down, retries pile up
 * - Exponential backoff still causes thundering herd on recovery
 * - User gets immediate feedback that command failed
 * - User can re-issue command when API is back
 * - System remains responsive (not blocked waiting for retries)
 * - No cascading failures from retry storms
 * 
 * Result: Failure is visible, contained, and recoverable.
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * TEST 5 — ADAPTER ISOLATION
 * ─────────────────────────
 * Confirmation: No other file imports @kubernetes/client-node
 * 
 * WHY THIS IS A SECURITY BOUNDARY:
 * - All Kubernetes mutations funnel through one file
 * - Code review is focused (only audit client.ts for K8s changes)
 * - Attack surface is minimal (3 methods, 2 mutations)
 * - If bug found, fix is localized
 * - If exploit found, remediation is fast
 * - Dependency updates happen in one place
 * 
 * VERIFICATION:
 * - grep -r "kubernetes/client-node" lib/ should only show client.ts
 * - No API routes call K8s directly
 * - Worker calls adapter → adapter calls K8s
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */
