import { sleep } from "./async-utils.js";
import { ERPromise } from "./erpromise.js";
import { Obs } from "./obs.js";

export const Locked: unique symbol = Symbol("Locked");
export type Locked = typeof Locked;

export namespace BoolLock {
  export const make = () => {
    const obs = Obs.make<void>();
    let locked = false;
    return {
      change: obs,
      locked: () => locked,
      use: <T>(fn: () => Promise<T>) => {
        if (locked) return Locked;
        locked = true;
        obs.emit();
        return fn().finally(() => {
          locked = false;
          obs.emit();
        });
      },
    };
  };
}

export type OptimisicLockStatus = {
  isActive: () => boolean;
  whenInactive: Promise<void>;
};
export namespace OptimisticLock {
  export const make = () => {
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

    return {
      change: obs,
      use: async <T>(fn: (lockStatus: OptimisicLockStatus) => Promise<T>) => {
        const currentLock = acquireLock();
        const res = fn(currentLock.status);
        res.finally(currentLock.resolve);
        return res;
      },
    };
  };
}

export namespace QueueLock {
  export const make = () => {
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

    return {
      length: () => queue.length + (criticalSection.locked() ? 1 : 0),
      whenEmpty: () => finishSignal.promise,
      change: obs,
      use: <T>(fn: () => Promise<T>) => {
        const { control, promise } = ERPromise.make<T>();
        const task = () => fn().then(control.resolve).catch(control.reject);
        queue.push(task);
        obs.emit();
        runCrit();
        return promise;
      },
    };
  };
}
