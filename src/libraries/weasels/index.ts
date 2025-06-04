// src/libraries/weasels/index.ts - Export all weasel components
import { SWeaselVm } from './sweaselvm';
import { WeaselSimulationOptimizer } from './weaselOptimizer';

// Only export what's needed by consumers
export { SWeaselVm } from './sweaselvm';
export { WeaselSimulationOptimizer } from './weaselOptimizer';

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
  withBadger: boolean = false
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

/**
 * Initializes an optimized weasel simulation in the provided container element
 * @param container The HTML container element
 * @param mutationLevel Mutation level (1-5)
 * @param withBadger Whether to include the badger predator
 * @param options Additional optimization options
 * @returns The optimizer instance
 */
export function initOptimizedWeaselSimulation(
  container: HTMLElement,
  mutationLevel: number = 5,
  withBadger: boolean = false,
  options: {
    speedMultiplier?: number,
    showFps?: boolean
  } = {}
): WeaselSimulationOptimizer {
  // Create and return the optimizer
  const optimizer = new WeaselSimulationOptimizer(
    container,
    mutationLevel,
    withBadger,
    options
  );

  // Initialize immediately by clicking the reset button
  const resetButton = container.querySelector('.btnReset');
  if (resetButton) {
    (resetButton as HTMLButtonElement).click();
  }

  return optimizer;
}