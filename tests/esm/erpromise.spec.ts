import { it, expect, describe } from "@jest/globals";
import { ERAbortable, ERPromise } from "../../dist/esm/erpromise.js";

describe("ERPromise", () => {
  it("should resolve on trigger", async () => {
    const er = ERPromise.make<symbol>();
    let capture: null | true | false = null;
    let capturedVal: null | symbol = null;
    const promise2 = er.promise
      .then((x) => {
        capture = true;
        capturedVal = x;
      })
      .catch((x) => (capture = false));

    expect(capture).toBe(null);
    const val = Symbol();
    er.control.resolve(val);
    await promise2;
    expect(capturedVal).toBe(val);
    expect(capture).toBe(true);
    er.control.reject(null);
    await promise2;
    expect(capture).toBe(true); // does not reject after resolve
    expect(capturedVal).toBe(val);
  });

  it("should reject on trigger", async () => {
    const er = ERPromise.make<symbol>();
    let capture: null | true | false = null;
    let capturedVal: null | symbol = null;
    const promise2 = er.promise
      .then((x) => {
        capture = true;
        capturedVal = x;
      })
      .catch((x) => (capture = false));

    expect(capture).toBe(null);
    er.control.reject(null);
    await promise2;
    expect(capturedVal).toBe(null);
    expect(capture).toBe(false);
    const val = Symbol();
    er.control.resolve(val);
    await promise2;
    expect(capture).toBe(false); // does not resolve after reject
    expect(capturedVal).toBe(null);
  });
});

describe("ERAbortable", () => {
  const setup = () => {
    const flags = {
      abortFromReturn: false,
      abortFromWhen: false,
    };
    const retval = Symbol();
    const barrier = ERPromise.make<void>();
    const abortable = ERAbortable.make(async (status) => {
      status.whenAborted.then(() => (flags.abortFromWhen = true));
      await barrier.promise;
      flags.abortFromReturn = status.isAborted();
      return retval;
    });

    return { barrier, abortable, flags, retval };
  };

  it("should work flag the correct abort status (unaborted)", async () => {
    const { abortable, barrier, flags, retval } = setup();

    barrier.control.resolve();
    expect(await abortable.promise).toEqual(retval);
    expect(flags.abortFromReturn).toEqual(false);
    expect(flags.abortFromWhen).toEqual(false);
  });

  it("should work flag the correct abort status (aborted)", async () => {
    const { abortable, barrier, flags, retval } = setup();

    abortable.abort();
    barrier.control.resolve();
    expect(await abortable.promise).toEqual(retval);
    expect(flags.abortFromReturn).toEqual(true);
    expect(flags.abortFromWhen).toEqual(true);
  });

  it("should abort after done shouldn't trigger whenAbort", async () => {
    const { abortable, barrier, flags, retval } = setup();

    barrier.control.resolve();
    expect(await abortable.promise).toEqual(retval);
    expect(flags.abortFromReturn).toEqual(false);
    expect(flags.abortFromWhen).toEqual(false);
    abortable.abort();
    await new Promise((res) => setTimeout(res, 3));
    expect(flags.abortFromReturn).toEqual(false);
    expect(flags.abortFromWhen).toEqual(false);
  });
});
