import { SchedulerWorker } from "@/lib/scheduler/worker";
import { Mutex } from "@/lib/scheduler/mutex";
import { getSharedQueue } from "@/lib/scheduler/sharedQueue";
import { StructuredLogger, generateExecutionId } from "../logging/structuredLogger";

let workerStarted = false;
let sharedMutex: Mutex | null = null;
let workerInstance: SchedulerWorker | null = null;

export function startWorkerOnce() {
  const bootstrapExecutionId = generateExecutionId();
  
  if (workerStarted) {
    StructuredLogger.info(bootstrapExecutionId, "system", "Worker already started - skipping");
    return;
  }

  StructuredLogger.info(bootstrapExecutionId, "system", "Starting SchedulerWorker");
  
  if (!sharedMutex) {
    sharedMutex = new Mutex();
  }
  
  const queue = getSharedQueue();
  
  workerInstance = new SchedulerWorker(sharedMutex, queue);
  workerInstance.start();
  
  setupShutdownHandlers();
  
  workerStarted = true;
  StructuredLogger.info(bootstrapExecutionId, "system", "SchedulerWorker started successfully");
}


function setupShutdownHandlers() {
  const handleShutdown = async (signal: string) => {
    const shutdownExecutionId = generateExecutionId();
    StructuredLogger.info(shutdownExecutionId, "system", `Received ${signal} - initiating graceful shutdown`);
    
    if (workerInstance) {
      await workerInstance.gracefulShutdown();
    }
    
    StructuredLogger.info(shutdownExecutionId, "system", "Shutdown complete");
    process.exit(0);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}