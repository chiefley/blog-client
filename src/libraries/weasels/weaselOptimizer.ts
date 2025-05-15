// src/libraries/weasels/weaselOptimizer.ts - Fixed version
import { SWeaselVm } from './sweaselvm';

export class WeaselSimulationOptimizer {
  private vm: SWeaselVm;
  private animationFrameId: number = 0;
  private cycleInterval: number | null = null;
  private fpsDisplayElement: HTMLElement | null = null;
  private lastCycleTime: number = 0;
  private frameCount: number = 0;
  private isRunning: boolean = false;

  constructor(
    private container: HTMLElement,
    private mutationLevel: number,
    private withBadger: boolean,
    private options: {
      speedMultiplier?: number,
      showFps?: boolean
    } = {}
  ) {
    // Set default options
    this.options.speedMultiplier = this.options.speedMultiplier || 1;
    this.options.showFps = this.options.showFps !== undefined ? this.options.showFps : false;

    // Initialize the view model
    this.vm = new SWeaselVm(container, mutationLevel, withBadger);

    // Replace the run button event to use our optimized cycle
    this.replaceRunButtonHandler();

    // Add FPS display if enabled
    if (this.options.showFps) {
      this.addFpsDisplay();
    }
  }

  private addFpsDisplay(): void {
    // Create FPS display element
    this.fpsDisplayElement = document.createElement('div');
    this.fpsDisplayElement.style.position = 'absolute';
    this.fpsDisplayElement.style.top = '10px';
    this.fpsDisplayElement.style.right = '10px';
    this.fpsDisplayElement.style.background = 'rgba(0, 0, 0, 0.5)';
    this.fpsDisplayElement.style.color = 'white';
    this.fpsDisplayElement.style.padding = '5px';
    this.fpsDisplayElement.style.borderRadius = '3px';
    this.fpsDisplayElement.style.fontSize = '12px';
    this.fpsDisplayElement.innerText = 'FPS: 0';

    // Add to container
    this.container.style.position = 'relative';
    this.container.appendChild(this.fpsDisplayElement);

    // Start FPS counter
    setInterval(() => {
      if (this.fpsDisplayElement && this.isRunning) {
        this.fpsDisplayElement.innerText = `FPS: ${this.frameCount}`;
        this.frameCount = 0;
      }
    }, 1000);
  }

  private replaceRunButtonHandler(): void {
    // Find the run and stop buttons
    const runButton = this.container.querySelector('.btnRun') as HTMLButtonElement;
    const stopButton = this.container.querySelector('.btnStop') as HTMLButtonElement;

    if (runButton && stopButton) {
      // Store original click handlers
      const originalRunClick = runButton.onclick;
      const originalStopClick = stopButton.onclick;

      // Replace run button handler
      runButton.onclick = (e) => {
        // Call original handler first
        if (originalRunClick) {
          originalRunClick.call(runButton, e);
        }

        // Start optimized cycle
        this.startOptimizedCycle();
      };

      // Replace stop button handler
      stopButton.onclick = (e) => {
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
    } else {
      // Faster speed - use optimized interval
      const interval = Math.max(10, Math.floor(500 / this.options.speedMultiplier!));
      this.cycleInterval = window.setInterval(() => this.runWorldCycle(), interval);
    }
  }

  private startAnimationFrameCycle(): void {
    const targetFrameTime = 1000 / 60; // Target 60 FPS

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

      // FIX: Make sure the DisplayValues method is called to update calories
      // @ts-ignore - Accessing private method
      this.vm.DisplayValues();

      this.frameCount++;
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

  // Public method to toggle FPS display
  public setShowFps(show: boolean): void {
    if (show === this.options.showFps) return;

    this.options.showFps = show;

    if (show) {
      this.addFpsDisplay();
    } else if (this.fpsDisplayElement) {
      this.container.removeChild(this.fpsDisplayElement);
      this.fpsDisplayElement = null;
    }
  }

  // Clean up resources
  public dispose(): void {
    this.stopOptimizedCycle();

    if (this.fpsDisplayElement && this.container.contains(this.fpsDisplayElement)) {
      this.container.removeChild(this.fpsDisplayElement);
      this.fpsDisplayElement = null;
    }
  }
}