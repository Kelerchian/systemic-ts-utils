/**
 * Purgable memoized function
 * @example
 * let input = 0;
 * const memoizedPlusOne = PurgeMemo.make(() => input + 1);
 * memoizedPlusOne.call() // 1
 * input = 1
 * memoizedPlusOne.call() // 1
 * memoizedPlusOne.purge()
 * memoizedPlusOne.call() // 2
 */
export type PurgeMemo<T> = {
  /**
   * Calls the memozied function or fetch a cached value
   */
  call: () => T;
  /**
   * Purge the cached value, prompting the function to be called next time
   */
  purge: () => void;
  /**
   * Returns a symbolic ID of the cached value which change on a purge
   */
  id: () => symbol;
};

export namespace PurgeMemo {
  export const UNINIT = Symbol("UNINIT");

  /**
   * Creates a `PurgeMemo`
   */
  export const make = <T>(originalCalculation: () => T): PurgeMemo<T> => {
    let innerId = Symbol();
    let val = UNINIT as T | typeof UNINIT;

    const purge = () => {
      val = UNINIT;
      innerId = Symbol();
    };

    const call = () => {
      const curval = val !== UNINIT ? val : originalCalculation();
      val = curval;
      return curval;
    };
    const id = () => innerId;

    return { purge, call, id };
  };
}
