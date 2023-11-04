import { it, expect, describe } from "@jest/globals";
import {
  IterCell,
  ObsIterCell,
  IterCellAllowedInners,
} from "../../dist/esm/iter-cell.js";

const ValueRegister = <T extends IterCellAllowedInners>(
  c: IterCell<T>,
  original: T,
) => {
  const innerStack: IterCell.ReadonlyOf<T>[] = [
    original as unknown as IterCell.ReadonlyOf<T>,
  ];

  const push = () => innerStack.unshift(c.access());
  const pushAndExpectDifferentAndEqualTo = (t: unknown) => {
    push();
    expect(innerStack[0]).not.toBe(innerStack[1]);
    expect(innerStack[0]).toEqual(t);
  };
  return { pushAndExpectDifferentAndEqualTo };
};

describe("IterCell", () => {
  it("should be able to contain Array", () => {
    const original: unknown[] = [];
    const iterCell = IterCell.make(original);

    const register = ValueRegister(iterCell, original);
    register.pushAndExpectDifferentAndEqualTo([]);

    iterCell.mutate((x) => x.push("c"));
    register.pushAndExpectDifferentAndEqualTo(["c"]);

    iterCell.replace((x) => [...x, "d", "e"]);
    register.pushAndExpectDifferentAndEqualTo(["c", "d", "e"]);

    iterCell.replace((x) => x);
    register.pushAndExpectDifferentAndEqualTo(["c", "d", "e"]);
  });

  it("should be able to contain Set", () => {
    const original: Set<unknown> = new Set();
    const iterCell = IterCell.make(original);
    const register = ValueRegister(iterCell, original);
    register.pushAndExpectDifferentAndEqualTo(new Set());

    iterCell.mutate((x) => x.add("c"));
    register.pushAndExpectDifferentAndEqualTo(new Set(["c"]));

    iterCell.replace((x) => new Set([...x, "d", "e"]));
    register.pushAndExpectDifferentAndEqualTo(new Set(["c", "d", "e"]));

    iterCell.replace((x) => x);
    register.pushAndExpectDifferentAndEqualTo(new Set(["c", "d", "e"]));
  });

  it("should be able to contain Map", () => {
    const original: Map<unknown, unknown> = new Map();
    const iterCell = IterCell.make(original);
    const register = ValueRegister(iterCell, original);
    register.pushAndExpectDifferentAndEqualTo(new Map());

    iterCell.mutate((x) => x.set("a", "a"));
    register.pushAndExpectDifferentAndEqualTo(new Map([["a", "a"]]));

    iterCell.replace(
      (x) =>
        new Map([
          ["a", "a"],
          ["b", "b"],
        ]),
    );
    register.pushAndExpectDifferentAndEqualTo(
      new Map([
        ["a", "a"],
        ["b", "b"],
      ]),
    );

    iterCell.replace((x) => x);
    register.pushAndExpectDifferentAndEqualTo(
      new Map([
        ["a", "a"],
        ["b", "b"],
      ]),
    );
  });
});

describe("ObsIterCell", () => {
  it("should be able to contain Array", () => {
    const original: unknown[] = [];
    const iterCell = ObsIterCell.make(original);

    const register = ValueRegister(iterCell, original);
    register.pushAndExpectDifferentAndEqualTo([]);

    iterCell.mutate((x) => x.push("c"));
    register.pushAndExpectDifferentAndEqualTo(["c"]);

    iterCell.replace((x) => [...x, "d", "e"]);
    register.pushAndExpectDifferentAndEqualTo(["c", "d", "e"]);

    iterCell.replace((x) => x);
    register.pushAndExpectDifferentAndEqualTo(["c", "d", "e"]);
  });

  it("should be able to contain Set", () => {
    const original: Set<unknown> = new Set();
    const iterCell = ObsIterCell.make(original);
    const register = ValueRegister(iterCell, original);
    register.pushAndExpectDifferentAndEqualTo(new Set());

    iterCell.mutate((x) => x.add("c"));
    register.pushAndExpectDifferentAndEqualTo(new Set(["c"]));

    iterCell.replace((x) => new Set([...x, "d", "e"]));
    register.pushAndExpectDifferentAndEqualTo(new Set(["c", "d", "e"]));

    iterCell.replace((x) => x);
    register.pushAndExpectDifferentAndEqualTo(new Set(["c", "d", "e"]));
  });

  it("should be able to contain Map", () => {
    const original: Map<unknown, unknown> = new Map();
    const iterCell = ObsIterCell.make(original);
    const register = ValueRegister(iterCell, original);
    register.pushAndExpectDifferentAndEqualTo(new Map());

    iterCell.mutate((x) => x.set("a", "a"));
    register.pushAndExpectDifferentAndEqualTo(new Map([["a", "a"]]));

    iterCell.replace(
      (x) =>
        new Map([
          ["a", "a"],
          ["b", "b"],
        ]),
    );
    register.pushAndExpectDifferentAndEqualTo(
      new Map([
        ["a", "a"],
        ["b", "b"],
      ]),
    );

    iterCell.replace((x) => x);
    register.pushAndExpectDifferentAndEqualTo(
      new Map([
        ["a", "a"],
        ["b", "b"],
      ]),
    );
  });

  it("should emit event to obs when mutate or replace is called", () => {
    let emissionsCount = 0;
    const hook = () => (emissionsCount += 1);
    const iterCell = ObsIterCell.make([]);
    iterCell.obs.sub(hook);
    expect(emissionsCount).toBe(0);
    iterCell.mutate((x) => {});
    expect(emissionsCount).toBe(1);
    iterCell.replace((x) => x);
    expect(emissionsCount).toBe(2);
  });
});
