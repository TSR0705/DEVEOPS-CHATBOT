
import { NextRequest } from "next/server";
import { getUserIdentity } from "../../../../lib/auth/identity";
import { getExecutionState } from "../../../../lib/observability/executionState";
import { AuthorizationError } from "../../../../lib/errors/userError";
import { StructuredLogger, generateExecutionId } from "../../../../lib/logging/structuredLogger";

export async function GET(_request: NextRequest) {
  const executionId = generateExecutionId();
  
  try {
    let identity;
    try {
      identity = await getUserIdentity();
    } catch (_authError) {
      const error = new AuthorizationError("Authentication required", executionId);
      StructuredLogger.error(executionId, "system", error.message, error.toLogEntry());
      return Response.json(error.toApiResponse(), { status: error.getHttpStatus() });
    }

    if (identity.role !== "ADMIN") {
      const error = new AuthorizationError("Admin role required for health endpoint", executionId);
      StructuredLogger.error(executionId, "system", error.message, error.toLogEntry());
      return Response.json(error.toApiResponse(), { status: error.getHttpStatus() });
    }

    const executionState = getExecutionState();

    StructuredLogger.info(executionId, "system", "Health check requested", {
      userId: identity.userId,
      workerStatus: executionState.workerStatus,
      queueLength: executionState.queueLength,
    });

    return Response.json({
      timestamp: Date.now(),
      status: "healthy",
      system: {
        workerStatus: executionState.workerStatus,
        queueLength: executionState.queueLength,
        mutex: executionState.mutexStatus,
        uptimeMs: executionState.uptimeMs,
      },
      execution: {
        currentCommand: executionState.currentCommand,
        lastResult: executionState.lastResult,
        lastError: executionState.lastError,
      },
    });
  } catch (error) {
    StructuredLogger.error(executionId, "system", "Health check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json(
      { 
        status: "unhealthy",
        error: "Health check failed",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}