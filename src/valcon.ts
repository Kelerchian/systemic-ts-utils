import { Obs } from "./obs.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Valcon<T extends any> = {
  get: () => T;
  set: (t: T) => unknown;
};
export namespace Valcon {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ObsValcon<T extends any> = Valcon<T> & {
  change: Obs<T>;
};

export namespace ObsValcon {
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
