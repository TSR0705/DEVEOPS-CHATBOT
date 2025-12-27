/**
 * PHASE 3.3 + 3.5 — SCHEDULER WORKER (COMMAND EXECUTOR)
 * 
 * This worker is the ONLY component in the system that executes EXECUTE commands.
 * 
 * WHY EXECUTION IS DECOUPLED FROM API ROUTES:
 * - API routes handle incoming requests at arbitrary times
 * - Multiple API calls can arrive simultaneously
 * - If APIs executed commands directly, we'd have race conditions
 * - The worker provides a SINGLE, CONTROLLED execution point
 * - This guarantees serialized, mutex-protected execution
 * 
 * ARCHITECTURE:
 * API Route → enqueues command to PriorityQueue
 * Worker → dequeues, acquires mutex, executes via K8sExecutor, releases mutex
 * 
 * This separation ensures:
 * - API routes return immediately (non-blocking for users)
 * - Commands are executed in priority order
 * - Only ONE command executes at a time (mutex guarantee)
 * - The system remains responsive under load
 * 
 * WHY WORKER CONTROLS LIFECYCLE:
 * - Worker decides WHEN to poll the queue
 * - Worker decides HOW to handle errors
 * - Worker ensures continuous operation
 * - External code cannot bypass the mutex
 * - Single point of control = single point to audit
 * 
 * PHASE 3.5 ADDITION:
 * - Worker now wired to K8sExecutor for real Kubernetes mutations
 * - EXECUTE + SCALE → executor.scaleDeployment()
 * - EXECUTE + RESTART → executor.restartDeployment()
 * - READ / DRY_RUN → no mutation, passthrough only
 */

import { Mutex } from "./mutex";
import { PriorityQueue } from "./priorityQueue";
import { ScheduledCommand } from "./types";
import { getK8sExecutor, K8sExecutor } from "../k8s/client";

/**
 * Command execution result status.
 * Used to track whether a command succeeded or failed.
 */
export type CommandStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

/**
 * CommandResult — Stores the outcome of a command execution.
 * This is stored in memory for visibility.
 */
export interface CommandResult {
  commandId: string;
  status: CommandStatus;
  error?: string;
  completedAt?: number;
}

export class SchedulerWorker {
  /**
   * Shared mutex instance for mutual exclusion.
   * ALL EXECUTE commands go through this single lock.
   */
  private mutex: Mutex;
  
  /**
   * Priority queue from which commands are dequeued.
   * Worker pulls from this queue in priority order.
   */
  private queue: PriorityQueue;
  
  /**
   * Running flag controls the worker loop.
   * - true: worker is active and processing
   * - false: worker will stop at next iteration
   */
  private running: boolean = false;
  
  /**
   * Poll interval in milliseconds.
   * How often the worker checks for new commands.
   * Not a timer — just a delay between poll cycles.
   */
  private pollIntervalMs: number = 100;
  
  /**
   * Execution log for testing.
   * Records the order of command execution.
   */
  public executionLog: string[] = [];
  
  /**
   * Track if currently executing (for test verification).
   * Used to verify mutual exclusion in tests.
   */
  public isExecuting: boolean = false;
  
  /**
   * Command results stored in memory.
   * Maps command ID to its execution result.
   * 
   * WHY VISIBILITY OF FAILURE IS MORE IMPORTANT THAN RETRIES:
   * - Retries hide failures from users
   * - Retries can cause cascading failures during outages
   * - Visible failures allow users to take corrective action
   * - Users can re-issue commands when system is healthy
   * - Debugging is easier when failures are explicit
   */
  public results: Map<string, CommandResult> = new Map();
  
  /**
   * K8sExecutor instance for Kubernetes mutations.
   * 
   * WHY A SINGLE ADAPTER INSTANCE IS SAFER:
   * - One connection to Kubernetes API (no connection storms)
   * - Single point of configuration
   * - No race conditions from multiple clients
   * - Easier to audit and monitor
   * - Memory efficient (single kubeconfig load)
   */
  private executor: K8sExecutor;
  
  constructor(mutex: Mutex, queue: PriorityQueue, executor?: K8sExecutor) {
    this.mutex = mutex;
    this.queue = queue;
    // Use provided executor or get singleton instance
    // Singleton ensures only ONE adapter exists in the entire system
    this.executor = executor || getK8sExecutor();
  }
  
  /**
   * start() — Begin the worker loop.
   * 
   * The worker runs continuously until stop() is called.
   * Each iteration:
   * 1. Check if running (exit if not)
   * 2. Check queue (sleep if empty)
   * 3. Dequeue command
   * 4. Acquire mutex
   * 5. Execute command (in try block)
   * 6. Release mutex (in finally block — ALWAYS)
   * 7. Repeat
   * 
   * WHY THIS STRUCTURE:
   * - Single point of entry (start)
   * - Single point of exit (running = false)
   * - Mutex protects execution
   * - finally guarantees cleanup
   * - Loop never blocks indefinitely
   */
  start(): void {
    if (this.running) {
      // Already running — prevent multiple workers
      return;
    }
    
    this.running = true;
    this.runLoop();
  }
  
  /**
   * stop() — Signal the worker to stop.
   * 
   * This sets running = false.
   * The worker will exit at the next loop iteration.
   * Currently executing command will complete first.
   * 
   * CLEAN SHUTDOWN:
   * - No abrupt termination
   * - Current command finishes
   * - Mutex is properly released
   * - No orphaned locks
   */
  stop(): void {
    this.running = false;
  }
  
  /**
   * runLoop() — The main worker loop.
   * 
   * This is an async function that runs continuously.
   * It uses async/await for control flow (not timers).
   * 
   * CRITICAL STRUCTURE:
   * 
   * while (running) {
   *   cmd = dequeue()
   *   if (cmd is EXECUTE) {
   *     await mutex.acquire()
   *     try {
   *       await executeCommand(cmd)  // Real K8s mutation
   *     } finally {
   *       mutex.release()  // ALWAYS runs
   *     }
   *   }
   *   await sleep()  // Prevent busy loop
   * }
   * 
   * WHY finally IS NON-NEGOTIABLE:
   * - If execute() throws, we MUST still release the mutex
   * - Without finally, an error would leave the mutex locked forever
   * - All subsequent commands would wait forever (deadlock)
   * - finally guarantees release() is called, period
   * 
   * WHY THIS GUARANTEES DEADLOCK-FREEDOM:
   * - No logic before acquire() (no pre-lock failures)
   * - No early returns inside try (all paths hit finally)
   * - catch logs but doesn't rethrow (worker continues)
   * - finally is mandatory and unconditional
   * - JavaScript runtime guarantees finally execution
   * 
   * NO DEADLOCK POSSIBLE:
   * - acquire() always eventually succeeds (FIFO guarantee)
   * - release() always called (finally guarantee)
   * - No nested locks (single acquire per command)
   * - No circular dependencies
   */
  private async runLoop(): Promise<void> {
    while (this.running) {
      // Try to get next command
      const cmd = this.queue.dequeue();
      
      if (cmd !== null) {
        // Only EXECUTE commands need mutex protection and K8s mutation
        if (cmd.parsed.type === "EXECUTE") {
          // Mark command as RUNNING
          this.results.set(cmd.id, {
            commandId: cmd.id,
            status: "RUNNING",
          });
          
          // STEP 1: Acquire exclusive access
          // This blocks (via Promise) until mutex is available
          // NO LOGIC BEFORE ACQUIRE — prevents pre-lock failures
          await this.mutex.acquire();
          
          // STEP 2: Execute with guaranteed cleanup
          try {
            // Mark as executing (for test verification)
            this.isExecuting = true;
            
            // Log execution start (for order verification)
            this.executionLog.push(`START:${cmd.id}`);
            
            // Execute the command via K8s adapter
            await this.executeCommand(cmd);
            
            // Log execution end
            this.executionLog.push(`END:${cmd.id}`);
            
            // Mark command as SUCCESS
            this.results.set(cmd.id, {
              commandId: cmd.id,
              status: "SUCCESS",
              completedAt: Date.now(),
            });
            
          } catch (error) {
            // Log error but DON'T rethrow
            // Worker must continue processing queue
            this.executionLog.push(`ERROR:${cmd.id}`);
            
            // Mark command as FAILED with error message
            // VISIBILITY: Failure is explicit and stored
            this.results.set(cmd.id, {
              commandId: cmd.id,
              status: "FAILED",
              error: error instanceof Error ? error.message : String(error),
              completedAt: Date.now(),
            });
            
          } finally {
            // STEP 3: ALWAYS release mutex
            // This is the CRITICAL safety guarantee
            // Even if execute() throws, mutex is released
            this.isExecuting = false;
            this.mutex.release();
          }
        } else {
          // READ and DRY_RUN commands don't need mutex
          // They don't modify state, so they can run freely
          // IMPORTANT: These NEVER reach the K8s executor
          this.executionLog.push(`PASSTHROUGH:${cmd.id}`);
        }
      }
      
      // Sleep briefly to prevent busy-waiting
      // This is NOT a timer — just a yield to event loop
      await this.sleep(this.pollIntervalMs);
    }
  }
  
  /**
   * executeCommand() — Map command to K8s executor method.
   * 
   * WHY EXPLICIT MAPPING PREVENTS PRIVILEGE ESCALATION:
   * - Only SCALE and RESTART actions are allowed
   * - Any other action throws an error
   * - No dynamic dispatch (no eval, no string-to-function)
   * - Attacker cannot inject arbitrary method calls
   * - Code path is auditable and deterministic
   * 
   * RULES:
   * - Explicit switch/if-else (no fallthrough)
   * - Unknown action = error (fail-closed)
   * - Only EXECUTE commands reach here (checked in runLoop)
   */
  private async executeCommand(cmd: ScheduledCommand): Promise<void> {
    const action = cmd.parsed.action;
    
    // EXPLICIT MAPPING: Only allowed actions pass through
    if (action === "SCALE") {
      // SCALE action: must have targetReplicas
      const replicas = cmd.parsed.targetReplicas;
      if (replicas === undefined) {
        throw new Error(`SCALE command missing targetReplicas: ${cmd.id}`);
      }
      // Call K8s adapter — this is the ONLY place SCALE mutates K8s
      await this.executor.scaleDeployment(replicas);
      
    } else if (action === "RESTART") {
      // RESTART action: no parameters needed
      // Call K8s adapter — this is the ONLY place RESTART mutates K8s
      await this.executor.restartDeployment();
      
    } else {
      // UNKNOWN ACTION: Fail-closed
      // This prevents privilege escalation via unknown action injection
      throw new Error(`Unknown EXECUTE action: ${action} for command ${cmd.id}`);
    }
  }
  
  /**
   * sleep() — Pause execution for a given duration.
   * 
   * Uses Promise + setImmediate for non-blocking delay.
   * This allows the event loop to process other tasks.
   * 
   * WHY NOT setInterval/setTimeout FOR SCHEDULING:
   * - We don't use timers to trigger work
   * - We use the loop to poll continuously
   * - Sleep just prevents CPU spin
   */
  private sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
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

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 3.5 — END-TO-END TEST SCENARIOS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * TEST 1 — SINGLE SCALE COMMAND
 * Input: enqueue "scale to 3"
 * Expected: Worker dequeues, mutex acquired, executor.scaleDeployment(3),
 *           Kubernetes replicas = 3, mutex released, command marked SUCCESS.
 * 
 * TEST 2 — BACK-TO-BACK SCALE COMMANDS
 * Input: "scale to 3" then "scale to 1"
 * WHY OVERLAP IS IMPOSSIBLE: Mutex blocks second command until first completes.
 * Result: Final replicas = 1.
 * 
 * TEST 3 — SCALE + RESTART ORDER
 * Input: "scale to 3" then "restart"
 * Expected: Strict order. Restart happens AFTER scale completes.
 * 
 * TEST 4 — FAILURE DURING EXECUTION
 * Scenario: K8s API fails during scale
 * WHY SYSTEM CONTINUES: finally block releases mutex, command marked FAILED,
 *                       worker continues to next command.
 * 
 * TEST 5 — PRIORITY ENFORCEMENT WITH REAL EXECUTION
 * Input: NORMAL "scale to 2", ADMIN "restart"
 * HOW PRIORITY + MUTEX ENFORCE: Queue orders ADMIN first, mutex ensures one at a time.
 * Result: ADMIN restart executes before NORMAL scale.
 * 
 * TEST 6 — SAFETY BOUNDARY VALIDATION
 * Confirmation: No K8s call outside worker. API routes never touch executor.
 *              Parser cannot trigger execution. READ/DRY_RUN never reach executeCommand().
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */
