import { NextRequest } from "next/server";
import { getUserIdentity } from "../../../../lib/auth/identity";
import { getExecutionState } from "../../../../lib/observability/executionState";

export async function GET(_request: NextRequest) {
  try {
    try {
      await getUserIdentity();
    } catch (_authError) {
      return Response.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }



    const executionState = getExecutionState();

    return Response.json({
      timestamp: Date.now(),
      system: {
        workerStatus: executionState.workerStatus,
        queueLength: executionState.queueLength,
        currentCommand: executionState.currentCommand,
        lastResult: executionState.lastResult,
      },
    });
  } catch (error) {
    console.error("[StatusAPI] Error getting execution state:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}