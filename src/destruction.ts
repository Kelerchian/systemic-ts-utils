import { ERPromise } from "./erpromise.js";

/**
 * Wrapper of hooks, promise, and boolean flag for manually destructible object.
 * @example
 * // Clean-up code
 * const destruction = Destruction.make();
 * const onEvent = () => doSomething();
 * globalEventEmitter.on("event", onEvent);
 * destruction.onDestroy(() => globalEventEmitter.off("event", onEvent));
 * await forSomeLongRunningFunction();
 * destruction.destroy(); // will call functions registered in `onDestroy`
 * @example
 * // Destructible object
 * const createDestructible = () => {
 *   const destruction = Destruction.make();
 *   const otherProperties = createOtherProperties();
 *   return {
 *     ...destruction,
 *     ...otherProperties
 *   }
 * }
 * @example
 * // Awaiting for destruction of destructible objects
 * const destructible = createDestructible();
 * await destructible.whenDestroyed;
 */
export type Destruction = {
  /**
   * @returns true if already destroyed.
   */
  isDestroyed: () => boolean;
  /**
   * Resolves when destroyed
   */
  whenDestroyed: Promise<unknown>;
  /**
   * Destroys the destruction object
   */
  destroy: () => unknown;
  /**
   * Register functions that will be called when destroyed
   */
  onDestroy: (fn: () => unknown) => unknown;
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export namespace Destruction {
  /**
   * Create a `Destruction` object.
   *
   * Wrapper of hooks, promise, and boolean flag for manually destructible object.
   * @example
   * // Clean-up code
   * const destruction = Destruction.make();
   * const onEvent = () => doSomething();
   * globalEventEmitter.on("event", onEvent);
   * destruction.onDestroy(() => globalEventEmitter.off("event", onEvent));
   * await forSomeLongRunningFunction();
   * destruction.destroy(); // will call functions registered in `onDestroy`
   * @example
   * // Destructible object
   * const createDestructible = () => {
   *   const destruction = Destruction.make();
   *   const otherProperties = createOtherProperties();
   *   return {
   *     ...destruction,
   *     ...otherProperties
   *   }
   * }
   * @example
   * // Awaiting for destruction of destructible objects
   * const destructible = createDestructible();
   * await destructible.whenDestroyed;
   */
  export const make = (): Destruction => {
    let destroyed = false;
    const isDestroyed = () => destroyed;

    // eslint-disable-next-line @typescript-eslint/ban-types
    const hooks: Function[] = [];
    const onDestroy = (hook: () => unknown) => {
      if (destroyed) return;
      hooks.push(hook);
    };

    const { promise: whenDestroyed, control } = ERPromise.make<void>();

    const destroy = () => {
      if (destroyed) return;
      destroyed = true;
      hooks.forEach((hook) => {
        try {
          return hook();
        } catch (error) {
          console.error(error);
          return error;
        }
      });
      hooks.length = 0;
      control.resolve();
    };

    return { isDestroyed, whenDestroyed, onDestroy, destroy };
  };
}
