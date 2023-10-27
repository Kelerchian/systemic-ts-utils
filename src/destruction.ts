import { ERPromise } from "./erpromise.js";

export type Destruction = {
  isDestroyed: () => boolean;
  whenDestroyed: Promise<unknown>;
  destroy: () => unknown;
  onDestroy: (fn: () => unknown) => unknown;
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export namespace Destruction {
  export const make = (): Destruction => {
    let destroyed = false;
    const isDestroyed = () => destroyed;

    // eslint-disable-next-line @typescript-eslint/ban-types
    const hooks: Function[] = [];
    const onDestroy = (hook: () => unknown) => {
      if (destroyed) return;
      hooks.push(hook);
    };

    const {
      promise: whenDestroyed,
      control: { resolve: destroy },
    } = ERPromise.make<void>();

    whenDestroyed.finally(() => {
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
    });

    return {
      isDestroyed,
      whenDestroyed,
      onDestroy,
      destroy,
    };
  };
}
