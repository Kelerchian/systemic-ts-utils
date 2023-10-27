export type ERPromise<T> = {
  promise: Promise<T>;
  control: {
    resolve: (_: T) => unknown;
    reject: (_: unknown) => unknown;
  };
};

/**
 * Externally Resolvable/Rejectable Promise
 */
export namespace ERPromise {
  export const make = <T>(): ERPromise<T> => {
    let control = null as unknown as ERPromise<T>["control"];
    const promise = new Promise<T>((resolve, reject) => {
      control = { resolve, reject };
    });
    return { promise, control };
  };
}

export type ERAbortable<T> = {
  promise: Promise<T>;
  abort: () => unknown;
};

export namespace ERAbortable {
  export type AbortStatus = {
    whenAborted: Promise<void>;
    isAborted: () => boolean;
  };

  export const make = <T>(
    fn: (onabort: AbortStatus) => Promise<T>,
  ): ERAbortable<T> => {
    let aborted = false;
    let done = false;
    const {
      control: { resolve: abortInner },
      promise: whenAborted,
    } = ERPromise.make<void>();
    const abort = () => {
      if (done) return;
      abortInner();
    };
    whenAborted.then(() => (aborted = true));
    const isAborted = () => aborted;

    const promise = (async () => {
      return await fn({ isAborted, whenAborted }).finally(() => (done = true));
    })();
    return { abort, promise };
  };

  type ERsIntoTupleT<ERs extends readonly ERAbortable<unknown>[]> = {
    -readonly [P in keyof ERs]: Awaited<ERs[P]["promise"]>;
  };

  type ERsIntoUnionT<ERs extends readonly ERAbortable<unknown>[]> = Promise<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Awaited<[ERs[any]["promise"]]>
  >;

  export const all = <ERs extends readonly ERAbortable<unknown>[]>(
    ers: ERs,
  ): ERAbortable<ERsIntoTupleT<ERs>> => ({
    promise: Promise.all(ers.map((er) => er.promise)) as Promise<
      ERsIntoTupleT<ERs>
    >,
    abort: () => ers.map((er) => er.abort()),
  });

  export const race = <ERs extends readonly ERAbortable<unknown>[]>(
    ers: ERs,
  ): ERAbortable<ERsIntoUnionT<ERs>> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let first: null | ERs[any] = null;

    const promise = (async () => {
      const race = Promise.race(ers.map((er) => er.promise));

      // first settled ER wins
      ers.forEach((er) =>
        er.promise.finally(() => {
          if (first) return;
          first = er;
        }),
      );

      // when race is settled, abort the rest of the winner
      race.finally(() =>
        ers.filter((er) => er !== first).forEach((er) => er.abort()),
      );

      return race;
    })() as Promise<ERsIntoUnionT<ERs>>;

    return {
      promise,
      abort: () => ers.map((er) => er.abort()),
    };
  };
}
