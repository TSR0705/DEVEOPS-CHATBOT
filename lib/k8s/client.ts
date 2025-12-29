import * as k8s from "@kubernetes/client-node";
import { KubernetesError } from "../errors/infraError";
import { TimeoutError } from "../errors/systemError";
import { StructuredLogger } from "../logging/structuredLogger";

const EXECUTION_TIMEOUT_MS = 15000;


const NAMESPACE = "demo";

const DEPLOYMENT_NAME = "loadlab";

const MIN_REPLICAS = 1;
const MAX_REPLICAS = 5;


export interface K8sExecutor {
  scaleDeployment(replicas: number, executionId?: string): Promise<void>;
  restartDeployment(executionId?: string): Promise<void>;
  getStatus(executionId?: string): Promise<K8sStatus>;
}

export interface K8sStatus {
  replicas: number;
  readyReplicas: number;
  pods: Array<{
    name: string;
    startTime: string | null;
  }>;
}


export class K8sClient implements K8sExecutor {
  private appsApi: k8s.AppsV1Api;
  private coreApi: k8s.CoreV1Api;

  constructor() {
    const kc = new k8s.KubeConfig();


    try {
      if (process.env.KUBERNETES_SERVICE_HOST) {
        StructuredLogger.info("system", "system", "Loading in-cluster Kubernetes configuration");
        kc.loadFromCluster();
      } else {
        StructuredLogger.info("system", "system", "Loading default kubeconfig (development mode)");
        kc.loadFromDefault();
      }
    } catch (error) {
      const kubeError = new KubernetesError(
        "Cannot load Kubernetes config. Ensure kubeconfig exists or running in-cluster with proper RBAC.",
        undefined,
        { originalError: error instanceof Error ? error.message : String(error) }
      );
      StructuredLogger.error("system", "system", kubeError.message, kubeError.toLogEntry());
      throw kubeError;
    }

    this.appsApi = kc.makeApiClient(k8s.AppsV1Api);
    this.coreApi = kc.makeApiClient(k8s.CoreV1Api);
  }

  private async withTimeout<T>(
    operation: () => Promise<T>,
    operationName: string,
    executionId?: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const error = new TimeoutError(operationName, EXECUTION_TIMEOUT_MS, executionId);
        StructuredLogger.error(executionId || "system", "failed", error.message, error.toLogEntry());
        reject(error);
      }, EXECUTION_TIMEOUT_MS);

      operation()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  async scaleDeployment(replicas: number, executionId?: string): Promise<void> {
    if (!Number.isInteger(replicas)) {
      throw new KubernetesError(
        `Invalid replica count: ${replicas}. Must be an integer.`,
        executionId,
        { requestedReplicas: replicas }
      );
    }

    if (replicas < MIN_REPLICAS || replicas > MAX_REPLICAS) {
      throw new KubernetesError(
        `Invalid replica count: ${replicas}. Must be between ${MIN_REPLICAS} and ${MAX_REPLICAS}.`,
        executionId,
        { requestedReplicas: replicas, minReplicas: MIN_REPLICAS, maxReplicas: MAX_REPLICAS }
      );
    }

    await this.withTimeout(async () => {
      try {
        // Use JSON Patch format (RFC 6902)
        const patch = [
          {
            op: 'replace',
            path: '/spec/replicas',
            value: replicas
          }
        ];

        await this.appsApi.patchNamespacedDeployment({
          name: DEPLOYMENT_NAME,
          namespace: NAMESPACE,
          body: patch,
          headers: {
            'Content-Type': 'application/json-patch+json'
          }
        });
        StructuredLogger.info(executionId || "system", "completed", "Scale operation succeeded", {
          deployment: DEPLOYMENT_NAME,
          namespace: NAMESPACE,
          replicas: replicas
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        StructuredLogger.error(executionId || "system", "failed", "K8s patch failed", {
          error: errorMsg,
          deployment: DEPLOYMENT_NAME,
          namespace: NAMESPACE,
          replicas: replicas
        });
        throw new KubernetesError(
          `Failed to scale deployment ${DEPLOYMENT_NAME} to ${replicas} replicas.`,
          executionId,
          { 
            deployment: DEPLOYMENT_NAME,
            namespace: NAMESPACE,
            requestedReplicas: replicas,
            originalError: errorMsg
          }
        );
      }
    }, `scale-deployment-${replicas}`, executionId);
  }

  async restartDeployment(executionId?: string): Promise<void> {
    await this.withTimeout(async () => {
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
        throw new KubernetesError(
          `Failed to restart deployment ${DEPLOYMENT_NAME}.`,
          executionId,
          {
            deployment: DEPLOYMENT_NAME,
            namespace: NAMESPACE,
            originalError: error instanceof Error ? error.message : String(error)
          }
        );
      }
    }, "restart-deployment", executionId);
  }

  async getStatus(executionId?: string): Promise<K8sStatus> {
    return this.withTimeout(async () => {
      try {
        const deploymentResponse = await this.appsApi.readNamespacedDeployment({
          name: DEPLOYMENT_NAME,
          namespace: NAMESPACE,
        });

        const deployment = deploymentResponse;
        const replicas = deployment.spec?.replicas ?? 0;
        const readyReplicas = deployment.status?.readyReplicas ?? 0;

        const labelSelector = `app=${DEPLOYMENT_NAME}`;
        const podsResponse = await this.coreApi.listNamespacedPod({
          namespace: NAMESPACE,
          labelSelector: labelSelector,
        });

        const pods = podsResponse.items.map(pod => ({
          name: pod.metadata?.name ?? "unknown",
          startTime: pod.status?.startTime?.toISOString() ?? null,
        }));

        return {
          replicas,
          readyReplicas,
          pods,
        };
      } catch (error) {
        throw new KubernetesError(
          `Failed to get status for deployment ${DEPLOYMENT_NAME}.`,
          executionId,
          {
            deployment: DEPLOYMENT_NAME,
            namespace: NAMESPACE,
            originalError: error instanceof Error ? error.message : String(error)
          }
        );
      }
    }, "get-status", executionId);
  }
}


let executor: K8sExecutor | null = null;

export function getK8sExecutor(): K8sExecutor {
  if (!executor) {
    executor = new K8sClient();
  }
  return executor;
}


