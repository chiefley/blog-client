// src/libraries/weasels/weaselOptimizer.ts - Simplified version without FPS
import { SWeaselVm } from './sweaselvm';

export class WeaselSimulationOptimizer {
  private vm: SWeaselVm;
  private animationFrameId = 0;
  private cycleInterval: number | null = null;
  private lastCycleTime = 0;
  private isRunning = false;

  constructor(
    private container: HTMLElement,
    mutationLevel: number,
    withBadger: boolean,
    private options: {
      speedMultiplier?: number,
      showFps?: boolean,
      isDarkMode?: boolean
    } = {}
  ) {
    // Set default options
    this.options.speedMultiplier = this.options.speedMultiplier || 1;

    // Initialize the view model
    this.vm = new SWeaselVm(container, mutationLevel, withBadger, this.options.isDarkMode || false);

    // Replace the run button event to use our optimized cycle
    this.replaceRunButtonHandler();
  }

  private replaceRunButtonHandler(): void {
    // Find the run and stop buttons
    const runButtonElement = this.container.querySelector('.btnRun');
    const stopButtonElement = this.container.querySelector('.btnStop');

    if (runButtonElement && stopButtonElement) {
      const runButton = runButtonElement as HTMLButtonElement;
      const stopButton = stopButtonElement as HTMLButtonElement;

      // Store original click handlers
      const originalRunClick = runButton.onclick;
      const originalStopClick = stopButton.onclick;

      // Replace run button handler
      runButton.onclick = (e: MouseEvent) => {
        // Call original handler first
        if (originalRunClick) {
          originalRunClick.call(runButton, e);
        }

        // Start optimized cycle
        this.startOptimizedCycle();
      };

      // Replace stop button handler
      stopButton.onclick = (e: MouseEvent) => {
        // Call original handler first
        if (originalStopClick) {
          originalStopClick.call(stopButton, e);
        }

        // Stop optimized cycle
        this.stopOptimizedCycle();
      };
    }
  }

  private startOptimizedCycle(): void {
    this.isRunning = true;
    this.lastCycleTime = performance.now();

    // Different optimization approaches based on speed multiplier
    if (this.options.speedMultiplier! <= 1) {
      // Regular speed - use requestAnimationFrame for smooth animation
      this.startAnimationFrameCycle();
    } else if (this.options.speedMultiplier! >= 10) {
      // Very fast speed - run multiple cycles per frame
      this.startMaxSpeedCycle();
    } else {
      // Medium speed - use optimized interval without artificial minimum
      const interval = Math.floor(500 / this.options.speedMultiplier!);
      this.cycleInterval = window.setInterval(() => { this.runWorldCycle(); }, interval);
    }
  }

  private startAnimationFrameCycle(): void {
    const animate = (timestamp: number) => {
      if (!this.isRunning) return;

      const elapsed = timestamp - this.lastCycleTime;

      // Only run world cycle at appropriate intervals
      if (elapsed >= 500) { // Original was 500ms per cycle
        this.runWorldCycle();
        this.lastCycleTime = timestamp;
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private startMaxSpeedCycle(): void {
    const cyclesPerFrame = Math.floor(this.options.speedMultiplier! / 10);
    
    const animate = () => {
      if (!this.isRunning) return;

      // Run multiple cycles per frame for maximum speed
      for (let i = 0; i < cyclesPerFrame; i++) {
        this.runWorldCycle();
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private runWorldCycle(): void {
    // Access the world cycle method (this is a hack, as it's not directly exposed)
    // @ts-ignore - Accessing private method
    if (this.vm._world) {
      // @ts-ignore - Accessing private method
      this.vm._world.worldCycle();

      // Force update the UI
      // @ts-ignore - Accessing private method
      this.vm.clearField();
      // @ts-ignore - Accessing private method
      this.vm.DrawAll();

      // Make sure the DisplayValues method is called to update calories
      // @ts-ignore - Accessing private method
      this.vm.DisplayValues();
    }
  }

  private stopOptimizedCycle(): void {
    this.isRunning = false;

    // Clean up animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }

    // Clean up interval
    if (this.cycleInterval !== null) {
      clearInterval(this.cycleInterval);
      this.cycleInterval = null;
    }
  }

  // Public method to reset the simulation
  public reset(): void {
    const resetButton = this.container.querySelector('.btnReset');
    if (resetButton) {
      (resetButton as HTMLButtonElement).click();
    }
  }

  // Public method to set simulation speed multiplier
  public setSpeedMultiplier(multiplier: number): void {
    this.options.speedMultiplier = multiplier;

    // If already running, restart with new speed
    if (this.isRunning) {
      this.stopOptimizedCycle();
      this.startOptimizedCycle();
    }
  }

  // Clean up resources
  public dispose(): void {
    this.stopOptimizedCycle();
  }

  // Public method to update theme
  public setDarkMode(isDarkMode: boolean): void {
    this.options.isDarkMode = isDarkMode;
    this.vm.setDarkMode(isDarkMode);
  }
}