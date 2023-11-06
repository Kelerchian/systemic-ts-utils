import { QueueLock } from "systemic-ts-utils/lock";

const ServiceUnavailable: unique symbol = Symbol("Service Unavailable");

const MAX_NUMBER_OF_TASK_IN_QUEUE = 100;

export const WorkerWithBackpressure = (() => {
  const queueLock = QueueLock.make(); // Built-in critical section processors similar to example 2-critical section
  return {
    queueTask: <T>(fn: () => Promise<T>) => {
      // max number of task in queue
      // simple number-based BackPressure
      if (queueLock.length() >= MAX_NUMBER_OF_TASK_IN_QUEUE) {
        return ServiceUnavailable;
      }
      return queueLock.use(fn);
    },
  };
})();
