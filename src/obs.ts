type Listener<T> = (message: T) => unknown;

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

    const unsub: Obs<T>["unsub"] = (listener) => {
      set.delete(listener);
    };

    const sub: Obs<T>["sub"] = (listener) => {
      set.add(listener);
      return () => unsub(listener);
    };

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
