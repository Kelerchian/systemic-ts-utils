import { it, expect, describe } from "@jest/globals";
import { Valcon, ObsValcon } from "../../dist/esm/valcon.js";

describe("Valcon", () => {
  it("should work accordingly", () => {
    const numcon = Valcon.make(1);
    expect(numcon.get()).toBe(1);
    numcon.set(2);
    expect(numcon.get()).toBe(2);
  });
});

describe("ObsValcon", () => {
  it("should work accordingly", () => {
    const numcon = ObsValcon.make(1);
    expect(numcon.get()).toBe(1);
    numcon.set(2);
    expect(numcon.get()).toBe(2);
  });
  it("should emit change event on ", () => {
    let emissionCount = 0;
    const numcon = ObsValcon.make(1);
    numcon.change.sub(() => {
      emissionCount += 1;
    });
    expect(emissionCount).toBe(0);
    numcon.set(1);
    expect(emissionCount).toBe(1);
    numcon.set(1);
    expect(emissionCount).toBe(2);
  });
});
