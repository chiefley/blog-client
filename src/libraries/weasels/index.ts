// src/libraries/weasels/index.ts - Main entry point that exports all components
import { SWeaselVm } from './sweaselvm';

export { Point } from './point';
export { Line } from './line';
export { Gene } from './gene';
export { Dna } from './dna';
export { SBadger } from './sbadger';
export { SWeasel } from './sweasel';
export { SWeaselWorld } from './sweaselworld';
export { SWeaselVm } from './sweaselvm';

/**
 * Initializes a weasel simulation in the provided container element
 * @param container The HTML container element
 * @param mutationLevel Mutation level (1-5)
 * @param withBadger Whether to include the badger predator
 * @returns The view model instance
 */
export function initWeaselSimulation(
  container: HTMLElement,
  mutationLevel: number = 5,
  withBadger: boolean = true
): SWeaselVm {
  // Create and return the view model
  const vm = new SWeaselVm(container, mutationLevel, withBadger);

  // Initialize immediately by clicking the reset button
  const resetButton = container.querySelector('.btnReset');
  if (resetButton) {
    (resetButton as HTMLButtonElement).click();
  }

  return vm;
}