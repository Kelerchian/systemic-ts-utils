export type PurgeMemo<T> = {
  call: () => T;
  purge: () => void;
  id: () => symbol;
};

export namespace PurgeMemo {
  export const UNINIT = Symbol("UNINIT");

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
