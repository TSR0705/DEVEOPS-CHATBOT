

import { Mutex } from "./mutex";
import { PriorityQueue } from "./priorityQueue";
import { ScheduledCommand } from "./types";
import { getK8sExecutor, K8sExecutor } from "../k8s/client";
import { 
  setWorkerStatus, 
  setCurrentCommand, 
  setLastResult,
  setLastError,
  setMutexStatus
} from "../observability/executionState";
import { StructuredLogger } from "../logging/structuredLogger";

export type CommandStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

export interface CommandResult {
  commandId: string;
  status: CommandStatus;
  error?: string;
  completedAt?: number;
}

export class SchedulerWorker {
  private mutex: Mutex;

  private queue: PriorityQueue;

  private running: boolean = false;

  private shuttingDown: boolean = false;

  private pollIntervalMs: number = 100;

  public executionLog: string[] = [];

  public isExecuting: boolean = false;

  public results: Map<string, CommandResult> = new Map();

  private executor: K8sExecutor;

  constructor(mutex: Mutex, queue: PriorityQueue, executor?: K8sExecutor) {
    this.mutex = mutex;
    this.queue = queue;

    this.executor = executor || getK8sExecutor();
  }


  start(): void {
    if (this.running) {
      
      return;
    }

    this.running = true;
    this.runLoop();
  }


  stop(): void {
    this.running = false;
  }


  async gracefulShutdown(): Promise<void> {
    const shutdownExecutionId = "shutdown_" + Date.now();
    
    StructuredLogger.info(shutdownExecutionId, "system", "Initiating graceful shutdown");
    
    this.shuttingDown = true;
    this.running = false;
    
    let attempts = 0;
    const maxAttempts = 50;
    
    while (this.isExecuting && attempts < maxAttempts) {
      await this.sleep(100);
      attempts++;
    }
    
    if (this.isExecuting) {
      StructuredLogger.warn(shutdownExecutionId, "system", "Shutdown timeout - current execution may be aborted");
    }
    

    setWorkerStatus("idle");
    setCurrentCommand(null);
    
    StructuredLogger.info(shutdownExecutionId, "system", "Graceful shutdown completed");
  }


  private async runLoop(): Promise<void> {
    while (this.running && !this.shuttingDown) {

      const cmd = this.queue.dequeue();

      if (cmd !== null && !this.shuttingDown) {

        if (cmd.parsed.type === "EXECUTE") {

          this.results.set(cmd.id, {
            commandId: cmd.id,
            status: "RUNNING",
          });


          
          await this.mutex.acquire();

          
          setMutexStatus("locked");

          
          setWorkerStatus("executing");
          setCurrentCommand(cmd);


          try {

            this.isExecuting = true;


            this.executionLog.push(`START:${cmd.id}`);
            StructuredLogger.info(cmd.executionId, "executing", "Command execution started", {
              commandId: cmd.id,
              userId: cmd.userId,
              action: cmd.parsed.action,
            });


            await this.executeCommand(cmd);


            this.executionLog.push(`END:${cmd.id}`);
            StructuredLogger.info(cmd.executionId, "completed", "Command execution completed", {
              commandId: cmd.id,
              userId: cmd.userId,
              action: cmd.parsed.action,
            });


            this.results.set(cmd.id, {
              commandId: cmd.id,
              status: "SUCCESS",
              completedAt: Date.now(),
            });

            setLastResult("success", `Command ${cmd.parsed.action} completed successfully`);
          } catch (error) {

            this.executionLog.push(`ERROR:${cmd.id}`);
            const errorMessage = error instanceof Error ? error.message : String(error);
            StructuredLogger.error(cmd.executionId, "failed", "Command execution failed", {
              commandId: cmd.id,
              userId: cmd.userId,
              action: cmd.parsed.action,
              error: errorMessage,
            });



            this.results.set(cmd.id, {
              commandId: cmd.id,
              status: "FAILED",
              error: errorMessage,
              completedAt: Date.now(),
            });

            setLastError(error instanceof Error ? error.constructor.name : "UnknownError", errorMessage);
            setLastResult("failed", `Command ${cmd.parsed.action} failed: ${errorMessage}`);
          } finally {
            this.isExecuting = false;
            

            setWorkerStatus("idle");
            setCurrentCommand(null);
            

            setMutexStatus("free");
            
            this.mutex.release();
          }
        } else {
          this.executionLog.push(`PASSTHROUGH:${cmd.id}`);
        }
      }


      await this.sleep(this.pollIntervalMs);
    }
  }


  private async executeCommand(cmd: ScheduledCommand): Promise<void> {
    const action = cmd.parsed.action;


    if (action === "SCALE") {

      const replicas = cmd.parsed.targetReplicas;
      if (replicas === undefined) {
        throw new Error(`SCALE command missing targetReplicas: ${cmd.id}`);
      }

      await this.executor.scaleDeployment(replicas, cmd.executionId);
      

      await this.verifyScaleOperation(replicas, cmd.id, cmd.executionId);
    } else if (action === "RESTART") {


      await this.executor.restartDeployment(cmd.executionId);
      

      await this.verifyRestartOperation(cmd.id, cmd.executionId);
    } else {

      throw new Error(
        `Unknown EXECUTE action: ${action} for command ${cmd.id}`
      );
    }
  }


  private async verifyScaleOperation(expectedReplicas: number, commandId: string, executionId: string): Promise<void> {
    try {

      await this.sleep(1000);
      
      const status = await this.executor.getStatus(executionId);
      
      if (status.replicas !== expectedReplicas) {
        throw new Error(
          `Scale verification failed for command ${commandId}: ` +
          `Expected ${expectedReplicas} replicas, but deployment shows ${status.replicas}`
        );
      }
      
      StructuredLogger.info(executionId, "completed", "Scale verification passed", {
        commandId: commandId,
        expectedReplicas,
        actualReplicas: status.replicas,
      });
    } catch (error) {
      StructuredLogger.error(executionId, "failed", "Scale verification failed", {
        commandId,
        expectedReplicas,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }


  private async verifyRestartOperation(commandId: string, executionId: string): Promise<void> {
    try {

      const status = await this.executor.getStatus(executionId);
      
      StructuredLogger.info(executionId, "completed", "Restart verification passed", {
        commandId: commandId,
        replicas: status.replicas,
      });
    } catch (error) {
      StructuredLogger.error(executionId, "failed", "Restart verification failed", {
        commandId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }


  private sleep(ms: number): Promise<void> {
    return new Promise<void>(resolve => {
      const start = Date.now();

      function check() {
        if (Date.now() - start >= ms) {
          resolve();
        } else {
          setImmediate(check);
        }
      }
      check();
    });
  }
}


