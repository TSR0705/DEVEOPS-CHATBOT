/**
 * PHASE 7.2 — SYSTEM ERROR CLASS
 * 
 * Errors in internal system components (worker, mutex, state).
 * Maps to HTTP 5xx status codes.
 */

import { BaseError } from "./base";

export class SystemError extends BaseError {
  constructor(
    message: string,
    executionId?: string,
    metadata?: Record<string, unknown>
  ) {
    super(message, "SYSTEM_ERROR", executionId, metadata);
  }

  getHttpStatus(): number {
    return 500;
  }
}

export class WorkerError extends SystemError {
  constructor(message: string, executionId?: string, metadata?: Record<string, unknown>) {
    super(`Worker error: ${message}`, executionId, metadata);
  }
}

export class MutexError extends SystemError {
  constructor(message: string, executionId?: string, metadata?: Record<string, unknown>) {
    super(`Mutex error: ${message}`, executionId, metadata);
  }
}

export class StateError extends SystemError {
  constructor(message: string, executionId?: string, metadata?: Record<string, unknown>) {
    super(`State error: ${message}`, executionId, metadata);
  }
}

export class TimeoutError extends SystemError {
  constructor(operation: string, timeoutMs: number, executionId?: string, metadata?: Record<string, unknown>) {
    super(`Operation timeout: ${operation} exceeded ${timeoutMs}ms`, executionId, metadata);
  }
}