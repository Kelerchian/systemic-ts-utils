import { it, expect } from "@jest/globals";
import { PurgeMemo } from "../../dist/esm/purge-memo.js";

it("should bump id on symbol and should recalculate after purge or when uninitialized", () => {
  let count = 0;
  const Retval = Symbol();
  const purgable = PurgeMemo.make(() => {
    count += 1;
    return Retval;
  });

  const id = purgable.id();

  expect(count).toBe(0);

  expect(purgable.call()).toBe(Retval);
  expect(purgable.id()).toBe(id);
  expect(count).toBe(1);

  expect(purgable.call()).toBe(Retval);
  expect(count).toBe(1);
  expect(purgable.id()).toBe(id);

  purgable.purge();
  expect(purgable.id()).not.toBe(id);
  expect(count).toBe(1);

  expect(purgable.call()).toBe(Retval);
  expect(count).toBe(2);
});
