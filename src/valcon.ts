import { Obs } from "./obs.js";

/**
 * Basic value container
 * @example
 * const container = Valcon.make(1)
 * container.get() // 1
 * container.set(2)
 * container.get() // 2
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Valcon<T extends any> = {
  get: () => T;
  set: (t: T) => unknown;
};

export namespace Valcon {
  /**
   * Creates an Valcon
   * @param t initial value
   */
  export const make = <T>(t: T): Valcon<T> => {
    let val = t;
    return {
      get: () => val,
      set: (newval: T) => {
        val = newval;
      },
    };
  };
}

/**
 * Observable value container
 * @example
 * let lastValue = 0;
 * const container = Valcon.make(1)
 * container.change.subscribe((x) => {
 *   lastValue = x;
 * })
 * container.set(2);
 * // lastValue === 2
 * container.get(); //
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ObsValcon<T extends any> = Valcon<T> & {
  change: Obs<T>;
};

export namespace ObsValcon {
  /**
   * Creates an ObsValcon
   * @param t initial value
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const make = <T extends any>(t: T): ObsValcon<T> => {
    const valcon = Valcon.make(t);
    const change = Obs.make<T>();
    const set: ObsValcon<T>["set"] = (newval: T) => {
      valcon.set(newval);
      change.emit(newval);
    };
    return { ...valcon, change, set };
  };
}
