import { PriorityQueue } from "./priorityQueue";

const queue = new PriorityQueue();

export function getSharedQueue(): PriorityQueue {
  return queue;
}