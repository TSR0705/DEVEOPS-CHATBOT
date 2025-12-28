/**
 * PHASE 3.3 — MUTEX (CRITICAL SECTION LOCK)
 *
 * This mutex implements the core synchronization primitive for EXECUTE commands.
 * It guarantees the three classical properties of mutual exclusion:
 *
 * 1. MUTUAL EXCLUSION: At most one command can be in the critical section at any time.
 *    - Implemented via the `locked` boolean flag
 *    - Only the holder of the lock can execute
 *
 * 2. PROGRESS: If the critical section is free and commands are waiting, one will enter.
 *    - release() immediately wakes the next waiter if queue is non-empty
 *    - No external intervention needed
 *
 * 3. BOUNDED WAITING: Every waiter eventually gets the lock (no starvation).
 *    - Waiters are stored in a FIFO queue
 *    - First-come-first-served ordering
 *    - No thread can be indefinitely bypassed
 *
 * DESIGN: Binary semaphore with FIFO waiting queue.
 *
 * WHY FIFO PREVENTS STARVATION:
 * - When release() is called, the OLDEST waiter (first in queue) is woken
 * - New acquire() calls go to the END of the queue
 * - Every waiter moves forward in the queue with each release
 * - Therefore, every waiter eventually reaches the front and acquires the lock
 *
 * CRITICAL: This is a non-reentrant, non-owning binary lock.
 * - No thread/caller ID tracking
 * - No recursion allowed
 * - Single global lock for all EXECUTE commands
 */

export class Mutex {
  /**
   * Lock state: true = locked, false = unlocked
   *
   * INVARIANT: When locked === true, exactly one execution is in progress.
   * INVARIANT: When locked === false AND waiters.length === 0, system is idle.
   */
  private locked: boolean = false;

  /**
   * FIFO queue of waiting resolvers.
   *
   * Each element is a resolve() function from a Promise.
   * When release() is called, the FIRST resolver is dequeued and invoked,
   * allowing that waiter to proceed.
   *
   * WHY FIFO:
   * - Guarantees bounded waiting (no starvation)
   * - Order of acquisition matches order of arrival
   * - Predictable, fair scheduling
   *
   * Array operations:
   * - push() adds to END (new waiters)
   * - shift() removes from FRONT (oldest waiter)
   */
  private waiters: Array<() => void> = [];

  /**
   * acquire() — Request exclusive access to the critical section.
   *
   * BEHAVIOR:
   * - If unlocked: Immediately lock and return (resolved Promise)
   * - If locked: Enqueue resolver, return pending Promise
   *
   * BLOCKING SEMANTICS:
   * The returned Promise resolves ONLY when this caller has exclusive access.
   * While waiting, the caller is suspended (Promise pending).
   *
   * WHY THIS PREVENTS SIMULTANEOUS ENTRY:
   * - Only one caller can find `locked === false` and set it to true
   * - All other callers see `locked === true` and must wait
   * - Waiting is enforced via Promise that doesn't resolve until release() wakes it
   *
   * NO BUSY WAITING:
   * - Waiters don't poll or spin
   * - They simply wait for their Promise to resolve
   * - Zero CPU overhead while waiting
   */
  acquire(): Promise<void> {
    return new Promise<void>(resolve => {
      if (!this.locked) {
        // Critical section is FREE — acquire immediately
        // Set locked BEFORE resolving to prevent race
        this.locked = true;
        resolve();
      } else {
        // Critical section is OCCUPIED — must wait
        // Enqueue this resolver at the END of the FIFO queue
        // Will be invoked by release() when lock becomes available
        this.waiters.push(resolve);
      }
    });
  }

  /**
   * release() — Relinquish exclusive access to the critical section.
   *
   * BEHAVIOR:
   * - If waiters exist: Wake the OLDEST waiter (FIFO order)
   * - If no waiters: Simply unlock
   *
   * CRITICAL INVARIANT:
   * This method MUST be called exactly once after each acquire().
   * It MUST be called even if the protected code throws an exception.
   * Use try/finally to guarantee this.
   *
   * WHY FIFO WAKE-UP:
   * - shift() removes and returns the FIRST element
   * - This is the OLDEST waiter (first to call acquire)
   * - Guarantees no starvation — every waiter eventually gets woken
   *
   * LOCK TRANSFER:
   * When we wake a waiter, we DON'T set locked = false.
   * The lock is "transferred" directly to the next waiter.
   * This prevents a race where a new acquire() could slip in between.
   *
   * STATE TRANSITIONS:
   * - Waiters exist: locked stays TRUE, next waiter gets the lock
   * - No waiters: locked becomes FALSE, system idle
   */
  release(): void {
    if (this.waiters.length > 0) {
      // Transfer lock to the OLDEST waiter (FIFO order)
      // Lock remains held — just by a different caller
      const nextWaiter = this.waiters.shift()!;
      // Wake the waiter by resolving their Promise
      nextWaiter();
    } else {
      // No waiters — release the lock entirely
      this.locked = false;
    }
  }
}
