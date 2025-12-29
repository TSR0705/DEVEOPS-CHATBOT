

import { BaseError } from "./base";

export class UserError extends BaseError {
  constructor(
    message: string,
    executionId?: string,
    metadata?: Record<string, any>
  ) {
    super(message, "USER_ERROR", executionId, metadata);
  }

  getHttpStatus(): number {

    return 400;
  }
}

export class AuthenticationError extends UserError {
  constructor(executionId?: string, metadata?: Record<string, any>) {
    super("Authentication required", executionId, metadata);
  }

  getHttpStatus(): number {
    return 401;
  }
}

export class AuthorizationError extends UserError {
  constructor(message: string = "Insufficient permissions", executionId?: string, metadata?: Record<string, any>) {
    super(message, executionId, metadata);
  }

  getHttpStatus(): number {
    return 403;
  }
}

export class ValidationError extends UserError {
  constructor(message: string, executionId?: string, metadata?: Record<string, any>) {
    super(`Validation failed: ${message}`, executionId, metadata);
  }
}

export class QuotaExceededError extends UserError {
  constructor(executionId?: string, metadata?: Record<string, any>) {
    super("Quota exceeded", executionId, metadata);
  }

  getHttpStatus(): number {
    return 429;
  }
}