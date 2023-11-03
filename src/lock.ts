import { sleep } from "./async-utils.js";
import { ERPromise } from "./erpromise.js";
import { Obs } from "./obs.js";

export const Locked: unique symbol = Symbol("Locked");
export type Locked = typeof Locked;

/**
 * `BoolLock`: a lock that locks when it is used to run an async function until
 * the resulting promise is resolved or rejected.
 * @example
 * import { BoolLock, Locked } from "systemic-ts-utils/lock"
 * const lock = BoolLock.make();
 * lock.use(aVeryLongAsyncFunction) // returns Promise
 * lock.use(anotherAsyncFunction) // returns Locked
 */
export type BoolLock = {
  change: Obs<void>;
  locked: () => boolean;
  use: <T>(_: () => Promise<T>) => Promise<T> | Locked;
};

export namespace BoolLock {
  /**
   * Create a `BoolLock`:
   *
   * `BoolLock`: a lock that locks when it is used to run an async function until
   * the resulting promise is resolved or rejected.
   * @example
   * import { BoolLock, Locked } from "systemic-ts-utils/lock"
   * const lock = BoolLock.make();
   * lock.use(aVeryLongAsyncFunction) // returns Promise
   * lock.use(anotherAsyncFunction) // returns Locked
   */
  export const make = (): BoolLock => {
    let locked = false;
    const obs = Obs.make<void>();
    const use: BoolLock["use"] = (fn) => {
      if (locked) return Locked;
      locked = true;
      obs.emit();
      return fn().finally(() => {
        locked = false;
        obs.emit();
      });
    };

    return { change: obs, use, locked: () => locked };
  };
}

/**
 * `OptimisticLock`: An overridable lock that informs a running async function
 * of its expiry.
 * @example
 * import { OptimisticLock } from "systemic-ts-utils/lock"
 * const lock = OptimisticLock.make()
 * lock.use(async (status) => {
 *   for (const task of tasks) {
 *     if (!status.isActive()) break;
 *     await task()
 *   }
 * })
 */
export type OptimisticLock = {
  /**
   * Event emitter that changes when the lock is changed
   */
  change: Obs<void>;
  use: <T>(_: (lockStatus: OptimisicLockStatus) => Promise<T>) => Promise<T>;
};

export type OptimisicLockStatus = {
  isActive: () => boolean;
  whenInactive: Promise<void>;
};

export namespace OptimisticLock {
  /**
   * Creates an `OptimisticLock`
   *
   * `OptimisticLock`: An overridable lock that informs a running async function
   * of its expiry.
   * @example
   * import { OptimisticLock } from "systemic-ts-utils/lock"
   * const lock = OptimisticLock.make()
   * lock.use(async (status) => {
   *   for (const task of tasks) {
   *     if (!status.isActive()) break;
   *     await task()
   *   }
   * })
   */
  export const make = (): OptimisticLock => {
    const obs = Obs.make<void>();
    let lock = null as null | ERPromise<void>;

    const nullifyOn = (someLock: ERPromise<void>) => {
      if (lock === someLock) {
        lock = null;
        obs.emit();
      }
    };

    const acquireLock = (): {
      status: OptimisicLockStatus;
      resolve: () => unknown;
    } => {
      lock?.control.resolve();
      const newLock = ERPromise.make<void>();
      lock = newLock;
      obs.emit();
      return {
        status: {
          isActive: () => lock === newLock,
          whenInactive: newLock.promise,
        },
        resolve: () => {
          newLock.control.resolve();
          nullifyOn(newLock);
        },
      };
    };

    const use: OptimisticLock["use"] = (fn) => {
      const currentLock = acquireLock();
      const res = fn(currentLock.status);
      res.finally(currentLock.resolve);
      return res;
    };

    return { change: obs, use };
  };
}

/**
 * `QueueLock`: A lock that queues an async function and runs it after previously queued functions are done
 * @example
 * const lock = QueueLock.make()
 * await Promise.all([
 *   lock.use(a),
 *   lock.use(b),
 *   lock.use(c),
 * ]);
 * // a, b, and c are executed consecutively
 */
export type QueueLock = {
  length: () => number;
  change: Obs<void>;
  whenEmpty: () => Promise<void>;
  use: <T>(fn: () => Promise<T>) => Promise<T>;
};

export namespace QueueLock {
  export const make = (): QueueLock => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const queue: Function[] = [];
    const criticalSection = BoolLock.make();
    const obs = Obs.make<void>();

    let finishSignal = ERPromise.make<void>();
    finishSignal.control.resolve();

    const runCrit = () =>
      criticalSection.use(async () => {
        const newFinishSignal = ERPromise.make<void>();
        finishSignal = newFinishSignal;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const task = queue.shift();
          if (!task) break;
          await task().catch(console.error);
          obs.emit();
          await sleep(0);
        }
        newFinishSignal.control.resolve();
      });

    // bind critical section to obs
    criticalSection.change.sub(obs.emit);

    const use: QueueLock["use"] = <T>(fn: () => Promise<T>) => {
      const { control, promise } = ERPromise.make<T>();
      const task = () => fn().then(control.resolve).catch(control.reject);
      queue.push(task);
      obs.emit();
      runCrit();
      return promise;
    };

    return {
      length: () => queue.length + (criticalSection.locked() ? 1 : 0),
      whenEmpty: () => finishSignal.promise,
      change: obs,
      use,
    };
  };
}
