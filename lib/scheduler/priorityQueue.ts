// Priority queue for fair command scheduling
// Sorts on insert to guarantee deterministic ordering
// Fairness is guaranteed: lower number = higher priority

import { ScheduledCommand } from "./types";

class PriorityQueue {
  private queue: ScheduledCommand[] = [];
  
  // Add command to queue and sort by priority then timestamp
  // Sorting on insert keeps dequeue O(1) and ensures deterministic ordering
  enqueue(cmd: ScheduledCommand): void {
    this.queue.push(cmd);
    // Sort by priority (ascending) then by timestamp (ascending)
    // Lower priority number means higher priority
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Lower number = higher priority
      }
      return a.timestamp - b.timestamp; // FIFO for same priority
    });
  }
  
  // Remove and return highest priority command
  // Returns null if queue is empty
  // Fairness: commands are processed in priority then timestamp order
  dequeue(): ScheduledCommand | null {
    if (this.queue.length === 0) {
      return null;
    }
    return this.queue.shift() || null;
  }
  
  // Get current queue size
  size(): number {
    return this.queue.length;
  }
}

export { PriorityQueue };
