/**
 * Externally Resolvable/Rejectable Promise
 * @example
 * const erpromise = ERPromise.make<void>();
 * sendSomewhere(erpromise.promise);
 * setTimeout(() => {
 *   erpromise.control.resolve()
 * }, 1000);
 */
export type ERPromise<T> = {
  /**
   * The resulting promise
   */
  promise: Promise<T>;
  /**
   * Control over the resulting promise's resolution or rejection
   */
  control: {
    resolve: (_: T) => unknown;
    reject: (_: unknown) => unknown;
  };
};

export namespace ERPromise {
  export const make = <T>(): ERPromise<T> => {
    let control = null as unknown as ERPromise<T>["control"];
    const promise = new Promise<T>((resolve, reject) => {
      control = { resolve, reject };
    });
    return { promise, control };
  };
}

/**
 * Externally Resolvable/Rejectable Abortable - A promise that can abort
 * @example
 * const abortable = ERAbortable.make(async (status) => {
 *   const connection = openConnection();
 *   status.whenAborted().then(() => connection.close());
 *
 *   let result = []
 *   while (!status.isAborted() && !isDone(result)) {
 *      result.push(await connection.getResult());
 *   }
 *
 *   if (status.isAborted()) return null;
 *
 *   return result;
 * })
 */
export type ERAbortable<T> = {
  /**
   * The resulting promise
   */
  promise: Promise<T>;
  /**
   * Sends abort signal to the running promise
   */
  abort: () => unknown;
};

export namespace ERAbortable {
  export type AbortStatus = {
    /**
     * Promise that resolves when the abortable is aborted
     */
    whenAborted: Promise<void>;
    /**
     * @returns true if aborted
     */
    isAborted: () => boolean;
  };

  /**
   * Externally Resolvable/Rejectable Abortable - A promise that can abort
   * @example
   * const abortable = ERAbortable.make(async (status) => {
   *   const connection = openConnection();
   *   status.whenAborted().then(() => connection.close());
   *
   *   let result = []
   *   while (!status.isAborted() && !isDone(result)) {
   *      result.push(await connection.getResult());
   *   }
   *
   *   if (status.isAborted()) return null;
   *
   *   return result;
   * })
   *
   * await abortable.promise; // waits for the promise to resolve
   * abortable.abort() // abort from the outside
   */
  export const make = <T>(
    fn: (onabort: AbortStatus) => Promise<T>,
  ): ERAbortable<T> => {
    const data = {
      aborted: false,
      done: false,
      abortER: ERPromise.make<void>(),
    };

    const isAborted = () => data.aborted;

    const abort = () => {
      console.log("abort", 1);
      if (data.done) return;
      console.log("abort", 2);
      data.aborted = true;
      console.log("abort", 3);
      data.abortER.control.resolve();
    };

    const promise = fn({
      isAborted,
      whenAborted: data.abortER.promise,
    }).finally(() => (data.done = true));

    return { abort, promise };
  };

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

    const promise = Promise.race(
      ers.map((er) =>
        er.promise.finally(() => {
          // first settled ER wins
          if (first) return;
          first = er;
          // when race is settled, abort the rest of the winner
          ers
            .filter((peerEr) => peerEr !== er)
            .forEach((peerEr) => peerEr.abort());
        }),
      ),
    ) as Promise<ERsIntoUnionT<ERs>>;

    return {
      promise,
      abort: () => ers.map((er) => er.abort()),
    };
  };

  type ERsIntoTupleT<ERs extends readonly ERAbortable<unknown>[]> = {
    -readonly [P in keyof ERs]: Awaited<ERs[P]["promise"]>;
  };

  type ERsIntoUnionT<ERs extends readonly ERAbortable<unknown>[]> = Promise<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Awaited<[ERs[any]["promise"]]>
  >;
}
