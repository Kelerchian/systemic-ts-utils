import { it, describe, expect } from "@jest/globals";
import {
  BoolLock,
  OptimisticLock,
  Locked,
  OptimisicLockStatus,
  QueueLock,
} from "../../dist/esm/lock.js";
import { ERPromise } from "../../dist/esm/erpromise.js";
import { sleep } from "../../dist/esm/async-utils.js";

describe("BoolLock", () => {
  it("should not run a passed function and returns Locked instead", async () => {
    const lock = BoolLock.make();
    const barrier = ERPromise.make<void>();
    let emitCount = 0;
    lock.change.sub(() => (emitCount += 1));

    let firstIsRun = false;
    let secondIsRun = false;
    let thirdIsRun = false;

    // First locked async fn
    const first = lock.use(async () => {
      await barrier.promise;
      firstIsRun = true;
    });

    expect(first).toBeInstanceOf(Promise);
    expect(emitCount).toBe(1);

    const second = lock.use(async () => {
      secondIsRun = true;
    });

    expect(emitCount).toBe(1);
    expect(second).toBe(Locked);

    // Let the first fn finish
    barrier.control.resolve();
    await first;
    expect(emitCount).toBe(2);

    // should run
    expect(
      await lock.use(async () => {
        thirdIsRun = true;
        return 1;
      }),
    ).toBe(1);
    expect(firstIsRun).toBe(true);
    expect(secondIsRun).toBe(false);
    expect(thirdIsRun).toBe(true);
  });
});

describe("OptimisticLock", () => {
  it("should not run a passed function and returns Locked instead", async () => {
    const lock = OptimisticLock.make();
    let emitCount = 0;
    lock.change.sub(() => (emitCount += 1));

    let firstLock = null as null | OptimisicLockStatus;
    let secondLock = null as null | OptimisicLockStatus;
    const firstBarrier = ERPromise.make<void>();
    const secondBarrier = ERPromise.make<void>();

    expect(emitCount).toBe(0);
    expect(lock.locked()).toBe(false);

    // First locked async fn
    const first = lock.use(async (x) => {
      firstLock = x;
      await firstBarrier.promise;
      return 1;
    });
    expect(lock.locked()).toBe(true);

    expect(emitCount).toBe(1);
    expect(firstLock).not.toBe(null);
    expect(firstLock?.isActive()).toBe(true);

    const second = lock.use(async (x) => {
      secondLock = x;
      await secondBarrier.promise;
      return 1;
    });

    expect(lock.locked()).toBe(true);

    expect(emitCount).toBe(2);
    expect(first).toBeInstanceOf(Promise);
    expect(second).toBeInstanceOf(Promise);

    expect(firstLock?.isActive()).toBe(false);
    expect(secondLock?.isActive()).toBe(true);

    // The second the second lock is triggered, it will be resolved
    await firstLock?.whenInactive;
    expect(lock.locked()).toBe(true);

    firstBarrier.control.resolve();
    expect(await first).toBe(1);

    expect(secondLock?.isActive()).toBe(true);
    secondBarrier.control.resolve();

    expect(await second).toBe(1);

    await secondLock?.whenInactive;
    expect(lock.locked()).toBe(false);
    expect(emitCount).toBe(3);
  });
});

describe("QueueLock", () => {
  it("should not run a passed function and returns Locked instead", async () => {
    const lock = QueueLock.make();
    let emitCount = 0;
    lock.change.sub(() => (emitCount += 1));

    expect(emitCount).toBe(0);

    const firstBarrier = ERPromise.make<void>();
    const first = lock.use(async () => {
      await firstBarrier.promise;
    });
    expect(emitCount).toBe(2); // emit because of task submission and critical section locking

    let secondIsExecuteCount = 0;
    const secondBarrier = ERPromise.make<void>();
    const second = lock.use(async () => {
      await secondBarrier.promise;
      secondIsExecuteCount += 1;
    });

    // intentionally release secondBarrier here
    secondBarrier.control.resolve();
    expect(secondIsExecuteCount).toBe(0); // second should not be executed before first is
    expect(emitCount).toBe(3); // emit due to enqueue

    const thirdBarrier = ERPromise.make<void>();
    const third = lock.use(async () => {
      await thirdBarrier.promise;
    });
    expect(emitCount).toBe(4); // emit due to enqueue

    firstBarrier.control.resolve();
    await first;
    await sleep(10);
    expect(secondIsExecuteCount).toBe(1);
    await second;
    expect(emitCount).toBe(6); // +2 because first's and second's tasks are finished

    thirdBarrier.control.resolve();
    await third;
    await sleep(10);
    expect(emitCount).toBe(8); // +e because of third's task is finished and followed by the critical section's unlocking
  });
});
