type Listener<T> = (message: T) => unknown;

/**
 * Basic observable
 * @example
 * let capturedString = "";
 * const stringObservable = Obs.make<string>();
 * const unsub = stringObservable.sub((newValue) => {
 *   capturedString = newValue;
 * });
 * stringObservable.emit("emittedString");
 * // capturedString === "emittedString"
 * unsub();
 * stringObservable.emit("emittedString2");
 * // capturedString === "emittedString"
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Obs<T extends any> = {
  sub: (listener: Listener<T>) => () => unknown;
  unsub: (listener: Listener<T>) => void;
  emit: (t: T) => unknown[];
  size: () => number;
};

export namespace Obs {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const make = <T extends any>(): Obs<T> => {
    const set = new Set<Listener<T>>();

    /**
     * Unsubscribe a listener from the observable
     */
    const unsub: Obs<T>["unsub"] = (listener) => {
      set.delete(listener);
    };

    /**
     * Subscribes a listener to emission and return a corresponding `unsub` function.
     */
    const sub: Obs<T>["sub"] = (listener) => {
      set.add(listener);
      return () => unsub(listener);
    };

    /**
     * Emit a data
     */
    const emit: Obs<T>["emit"] = (data) =>
      Array.from(set).map((listener) => {
        try {
          return listener(data);
        } catch (error) {
          console.error(error);
          return error;
        }
      });

    const size = () => set.size;

    return {
      sub,
      unsub,
      emit,
      size,
    };
  };

  export namespace Pipe {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const make = <T extends any>(source: Obs<T>, targets: Obs<T>[]) => {
      const unsub = source.sub((x) => targets.map((target) => target.emit(x)));
      return { unsub };
    };
  }
}
