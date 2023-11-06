import { sleep } from "systemic-ts-utils/async-utils";
import { Destruction } from "systemic-ts-utils/destruction";
import * as assert from "node:assert";

const SomeSideEffect = (() => {
  let sideEffectOn = true;
  return {
    turnOn: () => (sideEffectOn = true),
    turnOff: () => (sideEffectOn = true),
    get: () => sideEffectOn,
  };
})();

/**
 * Use destruction to do cleanups
 */
const generateDestructible = () => {
  const destruction = Destruction.make();
  SomeSideEffect.turnOn();
  destruction.onDestroy(() => {
    SomeSideEffect.turnOff();
  });
  return destruction;
};

/**
 * Create the destructible, and then later, clean up
 */
(async () => {
  const destructible = generateDestructible();
  assert(SomeSideEffect.get() === true);
  // kill the destructible
  destructible.destroy();
  assert(SomeSideEffect.get() === false);
})();
