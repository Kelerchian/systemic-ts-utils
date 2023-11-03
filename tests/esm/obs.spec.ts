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

it("should pipe obs emission until unsubbed", () => {
  let captured1 = 0;
  let captured2 = 0;
  let captured3 = 0;
  const obs1 = Obs.make<number>();
  const obs2 = Obs.make<number>();
  const obs3 = Obs.make<number>();
  obs1.sub((x) => (captured1 = x));
  obs2.sub((x) => (captured2 = x));
  obs3.sub((x) => (captured3 = x));
  const pipe = Obs.Pipe.make(obs1, [obs2, obs3]);

  obs1.emit(1);
  expect(captured1).toBe(1);
  expect(captured2).toBe(1);
  expect(captured3).toBe(1);
  pipe.unsub();
  obs1.emit(2);
  expect(captured1).toBe(2);
  expect(captured2).toBe(1);
  expect(captured3).toBe(1);
});
