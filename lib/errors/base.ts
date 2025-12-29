

export abstract class BaseError extends Error {
  public readonly errorType: string;
  public readonly executionId?: string;
  public readonly timestamp: number;
  public readonly metadata?: Record<string, any>;

  constructor(
    message: string,
    errorType: string,
    executionId?: string,
    metadata?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.errorType = errorType;
    this.executionId = executionId;
    this.timestamp = Date.now();
    this.metadata = metadata;


    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }


  abstract getHttpStatus(): number;


  toApiResponse(): Record<string, any> {
    return {
      error: this.message,
      errorType: this.errorType,
      timestamp: this.timestamp,
      ...(this.metadata && { metadata: this.metadata }),
    };
  }


  toLogEntry(): Record<string, any> {
    return {
      errorType: this.errorType,
      message: this.message,
      timestamp: this.timestamp,
      executionId: this.executionId,
      stack: this.stack,
      metadata: this.metadata,
    };
  }
}