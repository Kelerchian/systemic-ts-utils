import { Obs } from "./obs.js";
import { PurgeMemo } from "./purge-memo.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AllowedIterators = Array<any> | Set<any> | Map<any, any>;

export type IterCell<T extends AllowedIterators> = {
  access: () => T;
  mutate: (fn: (_: T) => unknown) => void;
  replace: (fn: (_: T) => T) => void;
};

export class IterCellError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "IterCellError";
  }
}

export namespace IterCell {
  export const make = <T extends AllowedIterators>(input: T): IterCell<T> => {
    let inner = copy(input);
    const access = () => inner;
    const mutate: IterCell<T>["mutate"] = (fn) => {
      const next = copy(inner);
      fn(next);
      inner = next;
    };
    const replace: IterCell<T>["replace"] = (fn) => {
      inner = fn(copy(inner));
      return;
    };

    return { access, mutate, replace };
  };

  export type Lazy<R> = PurgeMemo<R>;
  export namespace Lazy {
    export const make = <T extends AllowedIterators, R>(
      immutIter: IterCell<T>,
      calc: (t: T) => R,
    ) => {
      const lazy = PurgeMemo.make(() => calc(immutIter.access()));
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

export type ObsIterCell<T extends AllowedIterators> = IterCell<T> & {
  obs: Obs<void>;
};
export namespace ObsIterCell {
  export const make = <T extends AllowedIterators>(
    input: T,
  ): ObsIterCell<T> => {
    const iterCell = IterCell.make(input);
    const obs = Obs.make<void>();
    const obsIterCell: ObsIterCell<T> = {
      ...iterCell,
      obs,
      mutate: (...args) => {
        iterCell.mutate(...args);
        obs.emit();
      },
      replace: (...args) => {
        iterCell.replace(...args);
        obs.emit();
      },
    };
    return obsIterCell;
  };
}

// Utils
// =====

const copy = <T extends AllowedIterators>(input: T): T => {
  switch (true) {
    case input instanceof Set:
      return new Set(input) as T;
    case input instanceof Map:
      return new Map(input) as T;
    case Array.isArray(input):
      return [...input] as T;
  }
  throw new IterCellError("input is not instanceof Array, Set, or Map");
};
