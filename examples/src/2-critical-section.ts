import { sleep } from "systemic-ts-utils/async-utils";
import { ERPromise } from "systemic-ts-utils/erpromise";
import { BoolLock } from "systemic-ts-utils/lock";
import * as assert from "node:assert";

const CriticalSection = (() => {
  const tasks: (() => Promise<unknown>)[] = [];
  // Tips: Use BoolLock to make sure only one instance of an async function
  const lock = BoolLock.make();
  // Tips: If lock is locked then the function inside will not be called
  // IMPORTANT: This is the critical section https://en.wikipedia.org/wiki/Critical_section
  const work = () =>
    lock.use(async () => {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const nextTask = tasks.shift();
        if (!nextTask) break;
        await nextTask();
        // use setTimeout to give room for the JS event loop to breathe
        // just in case `nextTask` does not have any actual async operations
        await sleep(1);
      }
    });

  return {
    queueTask: <T>(fn: () => Promise<T>) => {
      // Tips: Use ERPromise to create a promise that you have control over its resolution/rejection
      const { control, promise } = ERPromise.make<T>();
      // Form a function that will trigger fn (the user's async function).
      // When fn resolves, trigger the ERPromise's resolve function, do with reject too
      const task = () => fn().then(control.resolve).catch(control.reject);
      // Push the task into tasks
      tasks.push(task);
      // Trigger the worker to work on the tasks, if it is not running yet
      work();
      // Return the promise that you control to the user
      return promise;
    },
  };
})();

// A chaotic sleep where you can't expect when it will resolve precisely
const chaoticSleep = () => sleep(Math.round(Math.random() * 1000));

// Do multiple asynchronous operations
(async () => {
  let x = 1;
  // These seemingly concurrent calls are worked sequentially
  await Promise.all([
    CriticalSection.queueTask(async () => {
      await chaoticSleep();
      x += 3;
    }),
    CriticalSection.queueTask(async () => {
      await chaoticSleep();
      x *= 5;
    }),
    CriticalSection.queueTask(async () => {
      await chaoticSleep();
      x -= 1;
    }),
  ]);
  assert(x === (1 + 3) * 5 - 1);
})();
