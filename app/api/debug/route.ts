import { NextRequest } from "next/server";
import { getExecutionState } from "../../../lib/observability/executionState";
import { startWorkerOnce } from "../../../lib/bootstrap/workerBootstrap";

export async function GET(request: NextRequest) {
  try {
    // Get current execution state
    const executionState = getExecutionState();
    
    // Try to start worker
    startWorkerOnce();
    
    return Response.json({
      message: "Debug endpoint working",
      executionState: executionState,
      workerStarted: true,
      timestamp: Date.now()
    });
  } catch (error) {
    return Response.json({
      message: "Debug endpoint error",
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    }, { status: 500 });
  }
}