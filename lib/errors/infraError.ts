import { BaseError } from "./base";

export class InfraError extends BaseError {
  constructor(
    message: string,
    executionId?: string,
    metadata?: Record<string, unknown>
  ) {
    super(message, "INFRA_ERROR", executionId, metadata);
  }

  getHttpStatus(): number {
    return 502;
  }
}

export class KubernetesError extends InfraError {
  constructor(message: string, executionId?: string, metadata?: Record<string, unknown>) {
    super(`Kubernetes error: ${message}`, executionId, metadata);
  }
}

export class NetworkError extends InfraError {
  constructor(message: string, executionId?: string, metadata?: Record<string, unknown>) {
    super(`Network error: ${message}`, executionId, metadata);
  }
}