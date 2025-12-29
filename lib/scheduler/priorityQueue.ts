

import { ScheduledCommand } from "./types";
import { setQueueLength } from "../observability/executionState";

class PriorityQueue {
  private queue: ScheduledCommand[] = [];


  enqueue(cmd: ScheduledCommand): void {
    this.queue.push(cmd);

    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.timestamp - b.timestamp;
    });


    setQueueLength(this.queue.length);
  }


  dequeue(): ScheduledCommand | null {
    if (this.queue.length === 0) {
      return null;
    }
    const cmd = this.queue.shift() || null;


    setQueueLength(this.queue.length);

    return cmd;
  }


  size(): number {
    return this.queue.length;
  }
}

export { PriorityQueue };
