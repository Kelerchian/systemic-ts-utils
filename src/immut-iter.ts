import { Purgable } from "./purgable.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ImmutableIter<T extends Array<any> | Set<any> | Map<any, any>> = {
  access: () => T;
  mutate: (fn: (_: T) => void) => void;
};

export namespace ImmutableIter {
  export class ImmutIterError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = "ImmutIterError";
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const copy = <T extends Array<any> | Set<any> | Map<any, any>>(
    input: T,
  ): T => {
    switch (true) {
      case input instanceof Set:
        return new Set(input) as T;
      case input instanceof Map:
        return new Map(input) as T;
      case Array.isArray(input):
        return [...input] as T;
    }
    throw new ImmutIterError("input is not instanceof Array, Set, or Map");
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const make = <T extends Array<any> | Set<any> | Map<any, any>>(
    input: T,
  ) => {
    let inner = copy(input);
    const access = () => inner;
    const mutate: ImmutableIter<T>["mutate"] = (fn) => {
      const next = copy(inner);
      const res = fn(next);
      inner = next;
      return res;
    };

    return { access, mutate };
  };

  export type Lazy<R> = Purgable<R>;
  export namespace Lazy {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const make = <T extends Array<any> | Set<any> | Map<any, any>, R>(
      immutIter: ImmutableIter<T>,
      calc: (t: T) => R,
    ) => {
      const lazy = Purgable.make(() => calc(immutIter.access()));
      let lastContainer = immutIter.access();
      const call = () => {
        const currentContainer = immutIter.access();
        if (lastContainer !== currentContainer) {
          lazy.purge();
          lastContainer = currentContainer;
        }
        return lazy.call();
      };
      return { call, purge: lazy.purge, id: lazy.id };
    };
  }
}
