import { NextRequest } from "next/server";
import { parseCommand } from "../../../lib/parser/parseCommand";
import {
  getUserIdentity,
  incrementQuota,
  getPriorityForUser,
  getQuotaRemaining,
} from "../../../lib/auth/identity";
import { ScheduledCommand, PriorityLevel } from "../../../lib/scheduler/types";
import { getSharedQueue } from "../../../lib/scheduler/sharedQueue";
import { startWorkerOnce } from "@/lib/bootstrap/workerBootstrap";
import { StructuredLogger, generateExecutionId } from "../../../lib/logging/structuredLogger";
import { AuthenticationError, ValidationError, QuotaExceededError } from "../../../lib/errors/userError";

// Export function to get the queue for external access
export function getQueue() {
  return getSharedQueue();
}



function generateCommandId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `cmd_${timestamp}_${random}`;
}


export async function GET(_request: NextRequest) {
  return Response.json({ message: "Chat API is working", timestamp: Date.now() });
}

export async function POST(request: NextRequest) {
  // Initialize worker on first request (not at module load time to avoid circular dependency)
  startWorkerOnce();

  const executionId = generateExecutionId();
  
  try {
    let identity;
    try {
      identity = await getUserIdentity();
    } catch (_authError) {
      const error = new AuthenticationError(executionId);
      StructuredLogger.error(executionId, "queued", error.message, error.toLogEntry());
      return Response.json(error.toApiResponse(), { status: error.getHttpStatus() });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      const error = new ValidationError("'message' field is required", executionId);
      StructuredLogger.error(executionId, "queued", error.message, error.toLogEntry());
      return Response.json(error.toApiResponse(), { status: error.getHttpStatus() });
    }

    const parsed = parseCommand(message);

    // Handle HELP commands
    if (parsed.type === "HELP") {
      const { generateHelpContent } = await import("../../../lib/help/helpContent");
      const helpContent = generateHelpContent(identity.role);
      
      return Response.json({
        type: "HELP",
        status: "success",
        help: helpContent,
        userId: identity.userId,
        role: identity.role,
        timestamp: Date.now(),
      });
    }

    // Handle READ commands
    if (parsed.type === "READ") {
      if (parsed.rawText.includes("status") || parsed.rawText === "status") {
        // Get real system and Kubernetes status
        try {
          const { getExecutionState } = await import("../../../lib/observability/executionState");
          const { getK8sExecutor } = await import("../../../lib/k8s/client");
          
          const executionState = getExecutionState();
          const k8sExecutor = getK8sExecutor();
          const k8sStatus = await k8sExecutor.getStatus(executionId);
          
          return Response.json({
            type: "READ",
            subtype: "STATUS",
            status: "success",
            system: {
              worker: executionState.workerStatus,
              queueLength: executionState.queueLength,
              currentCommand: executionState.currentCommand,
              lastResult: executionState.lastResult,
              uptime: executionState.uptimeMs
            },
            kubernetes: {
              deployment: "loadlab",
              namespace: "demo",
              replicas: k8sStatus.replicas,
              readyReplicas: k8sStatus.readyReplicas,
              totalPods: k8sStatus.pods.length,
              readyPods: k8sStatus.pods.filter(p => p.startTime !== null).length
            },
            userId: identity.userId,
            role: identity.role,
            timestamp: Date.now(),
          });
        } catch (_error) {
          return Response.json({
            type: "READ",
            subtype: "STATUS",
            status: "error",
            error: "Failed to fetch system status",
            userId: identity.userId,
            role: identity.role,
            timestamp: Date.now(),
          });
        }
      }
      
      if (parsed.rawText.includes("pods") || parsed.rawText.includes("show")) {
        // Get real pod information
        try {
          const { getK8sExecutor } = await import("../../../lib/k8s/client");
          const k8sExecutor = getK8sExecutor();
          const k8sStatus = await k8sExecutor.getStatus(executionId);
          
          const pods = k8sStatus.pods.map(pod => ({
            name: pod.name,
            status: pod.startTime ? "Running" : "Pending",
            ready: pod.startTime !== null,
            uptime: pod.startTime ? Math.floor((Date.now() - new Date(pod.startTime).getTime()) / 1000) : 0
          }));
          
          return Response.json({
            type: "READ",
            subtype: "PODS",
            status: "success",
            pods: pods,
            summary: {
              total: pods.length,
              ready: pods.filter(p => p.ready).length,
              deployment: "loadlab",
              namespace: "demo"
            },
            userId: identity.userId,
            role: identity.role,
            timestamp: Date.now(),
          });
        } catch (_error) {
          return Response.json({
            type: "READ",
            subtype: "PODS",
            status: "error",
            error: "Failed to fetch pod information",
            userId: identity.userId,
            role: identity.role,
            timestamp: Date.now(),
          });
        }
      }

      // Default read response
      return Response.json({
        type: "READ",
        status: "success",
        message: `Information query: "${parsed.rawText}"`,
        data: {
          query: parsed.rawText,
          suggestion: "Try 'status' for current system state or 'show pods' for pod information"
        },
        userId: identity.userId,
        role: identity.role,
        timestamp: Date.now(),
      });
    }

    // Handle DRY_RUN commands
    if (parsed.type === "DRY_RUN") {
      let simulationResult = "Simulation completed - no changes would be made.";
      let warnings: string[] = ["⚠️ This is a simulation only", "⚠️ No actual changes applied"];
      let preview = null;
      
      if (parsed.action === "SCALE" && parsed.targetReplicas !== undefined) {
        // Get current replica count for accurate preview
        try {
          const { getK8sExecutor } = await import("../../../lib/k8s/client");
          const k8sExecutor = getK8sExecutor();
          const k8sStatus = await k8sExecutor.getStatus(executionId);
          const currentReplicas = k8sStatus.replicas;
          
          if (parsed.targetReplicas < 1 || parsed.targetReplicas > 5) {
            simulationResult = `❌ SIMULATION FAILED: Invalid replica count ${parsed.targetReplicas}. Must be between 1 and 5.`;
            warnings = ["❌ Command would be rejected", "💡 Try: scale loadlab to 3"];
          } else {
            const direction = parsed.targetReplicas > currentReplicas ? "scale-up" : 
                            parsed.targetReplicas < currentReplicas ? "scale-down" : "no-change";
            
            simulationResult = `✅ SIMULATION: Would ${direction === "no-change" ? "maintain" : direction.replace("-", " ")} LoadLab to ${parsed.targetReplicas} replicas`;
            
            preview = {
              before: { replicas: currentReplicas },
              after: { replicas: parsed.targetReplicas },
              direction: direction,
              deployment: "loadlab",
              namespace: "demo"
            };
            
            warnings = [
              "⚠️ This is a simulation only",
              "⚠️ No pods would be created/destroyed", 
              `💡 To execute: scale loadlab to ${parsed.targetReplicas}`
            ];
          }
        } catch (_error) {
          simulationResult = `⚠️ SIMULATION: Cannot fetch current state, but would target ${parsed.targetReplicas} replicas`;
          warnings = [
            "⚠️ This is a simulation only",
            "⚠️ Could not verify current replica count",
            `💡 To execute: scale loadlab to ${parsed.targetReplicas}`
          ];
        }
      } else if (parsed.action === "RESTART") {
        simulationResult = "✅ SIMULATION: Would restart LoadLab deployment";
        preview = {
          action: "restart",
          deployment: "loadlab",
          namespace: "demo",
          effect: "All pods would be recreated with new timestamps"
        };
        warnings = [
          "⚠️ This is a simulation only",
          "⚠️ No pods would be restarted",
          "💡 To execute: restart loadlab"
        ];
      }

      return Response.json({
        type: "DRY_RUN",
        action: parsed.action,
        status: "simulation",
        message: simulationResult,
        preview: preview,
        simulation: {
          action: parsed.action,
          targetReplicas: parsed.targetReplicas,
          warnings,
          wouldExecute: parsed.targetReplicas ? (parsed.targetReplicas >= 1 && parsed.targetReplicas <= 5) : true,
          willExecute: false
        },
        userId: identity.userId,
        role: identity.role,
        timestamp: Date.now(),
      });
    }

    // Handle EXECUTE commands - validation and queueing
    if (parsed.action === "SCALE" && parsed.targetReplicas !== undefined) {
      if (parsed.targetReplicas < 1 || parsed.targetReplicas > 5) {
        const error = new ValidationError(
          `Invalid replica count: ${parsed.targetReplicas}. Must be between 1 and 5.`,
          executionId,
          { requestedReplicas: parsed.targetReplicas }
        );
        StructuredLogger.error(executionId, "queued", error.message, error.toLogEntry());
        return Response.json({
          ...error.toApiResponse(),
          command: {
            action: parsed.action,
            targetReplicas: parsed.targetReplicas,
          },
          suggestions: [
            "Try: scale loadlab to 3",
            "Valid range: 1-5 replicas",
            "Use 'dry run scale loadlab to N' to test first"
          ]
        }, { status: error.getHttpStatus() });
      }
    }

    // Get current state for before/after comparison
    let beforeState = null;
    let intent = null;
    
    if (parsed.action === "SCALE" && parsed.targetReplicas !== undefined) {
      try {
        const { getK8sExecutor } = await import("../../../lib/k8s/client");
        const k8sExecutor = getK8sExecutor();
        const k8sStatus = await k8sExecutor.getStatus(executionId);
        
        beforeState = {
          replicas: k8sStatus.replicas,
          readyReplicas: k8sStatus.readyReplicas,
          deployment: "loadlab",
          namespace: "demo"
        };
        
        intent = parsed.targetReplicas > k8sStatus.replicas ? "scale-up" : 
                parsed.targetReplicas < k8sStatus.replicas ? "scale-down" : "maintain";
      } catch (error) {
        // Continue without before state if K8s is unavailable
        StructuredLogger.warn(executionId, "queued", "Could not fetch current K8s state for comparison", {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const priority: PriorityLevel = getPriorityForUser(
      identity.userId,
      identity.role
    );

    const quotaBefore = getQuotaRemaining(identity.userId);

    if (identity.role === "FREE" && quotaBefore <= 0) {
      const error = new QuotaExceededError(executionId, { userId: identity.userId });
      StructuredLogger.error(executionId, "queued", error.message, error.toLogEntry());
      return Response.json({
        ...error.toApiResponse(),
        user: {
          role: identity.role,
          quotaRemaining: 0,
        },
        suggestions: [
          "Your quota is exceeded",
          "Commands will be queued with lower priority",
          "Admin users have unlimited quota"
        ]
      }, { status: error.getHttpStatus() });
    }

    if (identity.role === "FREE") {
      incrementQuota(identity.userId);
    }

    const scheduledCommand: ScheduledCommand = {
      id: generateCommandId(),
      executionId,
      userId: identity.userId,
      priority,
      timestamp: Date.now(),
      parsed,
    };

    const queue = getSharedQueue();
    queue.enqueue(scheduledCommand);
    
    StructuredLogger.info(executionId, "queued", "Command enqueued for execution", {
      commandId: scheduledCommand.id,
      userId: identity.userId,
      action: parsed.action,
      priority,
      queuePosition: queue.size(),
    });

    const queuePosition = queue.size();
    const priorityLabel = priority === 1 ? "ADMIN" : priority === 2 ? "FREE" : "NORMAL";
    
    return Response.json({
      status: "accepted",
      type: parsed.type,
      action: parsed.action,
      commandId: scheduledCommand.id,
      executionId: scheduledCommand.executionId,
      target: "loadlab",
      intent: intent,
      before: beforeState,
      after: parsed.action === "SCALE" ? {
        replicas: parsed.targetReplicas,
        deployment: "loadlab",
        namespace: "demo"
      } : null,
      phase: "queued",
      command: {
        action: parsed.action,
        targetReplicas: parsed.targetReplicas,
      },
      execution: {
        priority,
        priorityLabel,
        queuePosition,
        estimatedWaitTime: queuePosition * 2,
      },
      user: {
        role: identity.role,
        quotaRemaining: identity.role === "FREE" ? quotaBefore - 1 : undefined,
      },
      verificationSource: "kubernetes",
      message: `Command accepted and queued for execution (position ${queuePosition}, ${priorityLabel} priority)`,
      timestamp: Date.now(),
    });
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof QuotaExceededError) {
      throw error;
    }
    
    StructuredLogger.error(executionId, "failed", "System error processing command", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return Response.json(
      { 
        error: "Internal server error",
        errorType: "SYSTEM_ERROR",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

