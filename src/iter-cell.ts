import { Obs } from "./obs.js";
import { PurgeMemo } from "./purge-memo.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IterCellAllowedInners = Array<any> | Set<any> | Map<any, any>;

/**
 * Iterator Cell, a data structure that wraps immutable Set, Map, or Array at
 * compile-time.
 * @example
 * const setCell = IterCell.make(new Set<string>());
 * const mapCell = IterCell.make(new Map<number | string, unknown>());
 * const arrayCell = IterCell.make([1, "somestring", {}]);
 * @example
 * const immutableSet = IterCell.make(new Set<string>())
 * const state1 = immutableSet.access()
 * const state2 = immutableSet.access()
 * immutableSet.mutate((set) => {
 *   // modify set
 * })
 * const stateAfterMutation = immutableSet.access()
 * immutableSet.replace((set) => new Set())
 * const stateAfterReplacement = immutableSet.access()
 * // state1 === state2
 * // state1 !== stateAfterMutation
 * // state1 !== stateAfterReplacement
 * // stateAfterMutation !== stateAfterReplacement
 */
export type IterCell<T extends IterCellAllowedInners> = {
  /**
   * Retrieve a readonly version of its inner iterable
   */
  access: () => ReadonlyOf<T>;
  /**
   * Copy the inner iterable and receive a mutating function
   */
  mutate: (fn: (_: T) => unknown) => void;
  /**
   * Replace the inner iterable with the result of the passed function
   */
  replace: (fn: (_: T) => T) => void;
};

export class IterCellError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "IterCellError";
  }
}

export namespace IterCell {
  /**
   * Create an `IterCell`
   *
   * Iterator Cell, a data structure that wraps immutable Set, Map, or Array at
   * compile-time.
   * @example
   * const setCell = IterCell.make(new Set<string>());
   * const mapCell = IterCell.make(new Map<number | string, unknown>());
   * const arrayCell = IterCell.make([1, "somestring", {}]);
   * @example
   * const immutableSet = IterCell.make(new Set<string>())
   * const state1 = immutableSet.access()
   * const state2 = immutableSet.access()
   * immutableSet.mutate((set) => {
   *   // modify set
   * })
   * const stateAfterMutation = immutableSet.access()
   * immutableSet.replace((set) => new Set())
   * const stateAfterReplacement = immutableSet.access()
   * // state1 === state2
   * // state1 !== stateAfterMutation
   * // state1 !== stateAfterReplacement
   * // stateAfterMutation !== stateAfterReplacement
   */
  export const make = <T extends IterCellAllowedInners>(
    input: T,
  ): IterCell<T> => {
    let inner = copy(input);
    const access = () => inner as unknown as ReadonlyOf<T>;
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
    export const make = <T extends IterCellAllowedInners, R>(
      immutIter: IterCell<T>,
      calc: (t: ReadonlyOf<T>) => R,
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

export type ObsIterCell<T extends IterCellAllowedInners> = IterCell<T> & {
  obs: Obs<void>;
};
export namespace ObsIterCell {
  export const make = <T extends IterCellAllowedInners>(
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

const copy = <T extends IterCellAllowedInners>(input: T): T => {
  if (input instanceof Set) {
    return new Set(input) as T;
  } else if (input instanceof Map) {
    return new Map(input) as T;
  } else if (Array.isArray(input)) {
    return [...input] as T;
  }
  throw new IterCellError("input is not instanceof Array, Set, or Map");
};

type ReadonlyOf<T extends IterCellAllowedInners> = T extends Set<infer P>
  ? ReadonlySet<P>
  : T extends Map<infer K, infer V>
  ? ReadonlyMap<K, V>
  : T extends Array<infer P>
  ? ReadonlyArray<P>
  : never;
