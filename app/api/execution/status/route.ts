import { NextRequest } from "next/server";
import { getUserIdentity } from "../../../../lib/auth/identity";
import { getExecutionState } from "../../../../lib/observability/executionState";
import { AuthenticationError } from "../../../../lib/errors/userError";
import { StructuredLogger, generateExecutionId } from "../../../../lib/logging/structuredLogger";

export async function GET(_request: NextRequest) {
  const executionId = generateExecutionId();
  
  try {
    let identity;
    try {
      identity = await getUserIdentity();
    } catch (_authError) {
      const error = new AuthenticationError(executionId);
      StructuredLogger.error(executionId, "system", error.message, error.toLogEntry());
      return Response.json(error.toApiResponse(), { status: error.getHttpStatus() });
    }

    // Allow any authenticated user to check execution status (not just admins)
    const executionState = getExecutionState();

    return Response.json({
      timestamp: Date.now(),
      system: {
        workerStatus: executionState.workerStatus,
        queueLength: executionState.queueLength,
        currentCommand: executionState.currentCommand,
        lastResult: executionState.lastResult,
        lastError: executionState.lastError,
      },
      user: {
        userId: identity.userId,
        role: identity.role,
      }
    });
  } catch (error) {
    StructuredLogger.error(executionId, "system", "Error getting execution status", {
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}