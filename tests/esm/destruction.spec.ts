import { it, expect, describe } from "@jest/globals";
import { Destruction } from "../../dist/esm/destruction.js";

it("should state the destruction status correctly", () => {
  const destruction = Destruction.make();
  expect(destruction.isDestroyed()).toBe(false);
  destruction.destroy();
  expect(destruction.isDestroyed()).toBe(true);
});

it("should execute all destruction hook correctly once", () => {
  let hookExecuteCount = 0;
  const hook = () => (hookExecuteCount += 1);

  const extraHooks = (() => {
    const array = [false, false, false, false, false];
    const allTriggered = () => array.indexOf(false) === -1;
    const hooks = array.map((_, i) => () => {
      array[i] = true;
    });
    return { allTriggered, hooks };
  })();

  const destruction = Destruction.make();
  destruction.onDestroy(hook);
  extraHooks.hooks.map((hook) => destruction.onDestroy(hook));

  expect(hookExecuteCount).toBe(0);
  destruction.destroy();
  expect(hookExecuteCount).toBe(1);
  destruction.destroy();
  expect(hookExecuteCount).toBe(1);

  expect(extraHooks.allTriggered()).toBe(true);
});

it("should trigger whenDestroyed promise on destroy", async () => {
  let promiseResolved = false;
  const destruction = Destruction.make();
  const promise = destruction.whenDestroyed.then(
    () => (promiseResolved = true),
  );
  expect(promiseResolved).toBe(false);
  destruction.destroy();
  await promise;
  expect(promiseResolved).toBe(true);
});
