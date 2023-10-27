import { it, expect } from "@jest/globals";
import { Obs } from "../../dist/esm/obs.js";

it("should emit value to subscribed listener", () => {
  let val = 0;
  const obs = Obs.make<number>();
  obs.sub((x) => {
    val = x;
  });

  const test = (num: number) => {
    obs.emit(num);
    expect(val).toBe(num);
  };

  [1, 4, 2].forEach(test);
});

it("should not emit to unsubscribed listener", () => {
  let val = 0;
  const obs = Obs.make<number>();
  const unsub = obs.sub((x) => {
    val = x;
  });
  unsub();

  obs.emit(1);
  expect(val).toBe(0);
  obs.emit(2);
  expect(val).toBe(0);
});

it("should not emit to unsubscribed listener (by unsub method)", () => {
  let val = 0;
  const obs = Obs.make<number>();
  const listener = (x: number) => {
    val = x;
  };
  obs.sub(listener);
  obs.unsub(listener);

  obs.emit(1);
  expect(val).toBe(0);
  obs.emit(2);
  expect(val).toBe(0);
});
