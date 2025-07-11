// src/libraries/weasels/sweaselvm.ts - Fixed canvas scaling version
import { SWeaselWorld } from './sweaselworld';

export class SWeaselVm {
  private _world: SWeaselWorld | undefined;
  private _context: CanvasRenderingContext2D;
  private _cycleTimer = 0;
  private _running = false;
  private _initialized = false;
  private _generations = 0;
  private _scaleX = 1;
  private _scaleY = 1;
  private _isDarkMode = false;

  private _field: HTMLCanvasElement;
  private _txtNumSources: HTMLInputElement;
  private _btnReset: HTMLButtonElement;
  private _btnRun: HTMLButtonElement;
  private _btnStop: HTMLButtonElement;
  private _btnEarthquake: HTMLButtonElement;
  private _btnSingleStep: HTMLButtonElement;
  private _lblGenerations: HTMLSpanElement;
  private _lblSpentCalories: HTMLSpanElement;
  private _lblAcquiredCalories: HTMLSpanElement;
  private _lblNetCalories: HTMLSpanElement;

  private _allBtnStops: HTMLCollectionOf<HTMLButtonElement>;

  constructor(containerElem: HTMLElement, private mutationLevel: number, private withBadger: boolean, isDarkMode = false) {
    this._isDarkMode = isDarkMode;
    // Get UI elements
    this._field = containerElem.querySelector(".field")!;
    this._txtNumSources = containerElem.querySelector(".txtNumSources")!;
    this._btnReset = containerElem.querySelector(".btnReset")!;
    this._btnRun = containerElem.querySelector(".btnRun")!;
    this._btnStop = containerElem.querySelector(".btnStop")!;
    this._btnEarthquake = containerElem.querySelector(".btnEarthquake")!;
    this._lblGenerations = containerElem.querySelector(".lblGenerations")!;
    this._lblSpentCalories = containerElem.querySelector(".lblSpentCalories")!;
    this._lblAcquiredCalories = containerElem.querySelector(".lblAcquiredCalories")!;
    this._lblNetCalories = containerElem.querySelector(".lblNetCalories")!;
    this._allBtnStops = document.getElementsByClassName("btnStop") as HTMLCollectionOf<HTMLButtonElement>;
    this._btnSingleStep = containerElem.querySelector(".btnSingleStep")!;

    // Initialize the canvas
    const ctx = this._field.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    this._context = ctx;
    
    // Fix canvas scaling to use the full display area
    this.setupCanvas();

    // Set up event handlers
    this._btnReset.onclick = () => { this.btnResetClick(); };
    this._btnRun.onclick = () => { this.btnRunClick(); };
    this._btnStop.onclick = () => { this.btnStopClick(); };
    this._btnEarthquake.onclick = () => { this.btnEarthquakeClick(); };
    this._btnSingleStep.onclick = () => { this.btnSingleStepClick(); };

    // Set initial source count only if not already set
    if (!this._txtNumSources.value) {
      this._txtNumSources.value = "25";
    }

    // Initialize state
    this._running = false;
    this._initialized = false;
    this._generations = 0;
    this.viewEnable();
  }

  private setupCanvas = (): void => {
    // Get the actual displayed size of the canvas
    const displayWidth = this._field.clientWidth;
    const displayHeight = this._field.clientHeight;
    
    // Get the internal canvas size
    const canvasWidth = this._field.width;
    const canvasHeight = this._field.height;
    
    // Calculate scale factors to map from our 1000x1000 coordinate space
    // to the full canvas dimensions
    this._scaleX = canvasWidth / 1000;
    this._scaleY = canvasHeight / 1000;
    
    // Apply the scaling transformation
    this._context.setTransform(this._scaleX, 0, 0, this._scaleY, 0, 0);
    
    // Set default styling
    this._context.font = "30px Arial";
    
    console.log(`Canvas setup: display(${displayWidth}x${displayHeight}) canvas(${canvasWidth}x${canvasHeight}) scale(${this._scaleX.toFixed(2)}x${this._scaleY.toFixed(2)})`);
  };

  private init = (): void => {
    if (this._txtNumSources.value === "") {
      this._txtNumSources.value = "25";
    }

    let numSources = Math.floor(this._txtNumSources.valueAsNumber);
    if (numSources < 5) {
      this._txtNumSources.value = "5";
      numSources = 5;
    }

    if (numSources > 100) {
      this._txtNumSources.value = "100";
      numSources = 100;
    }

    this._world = new SWeaselWorld(numSources, this.mutationLevel, this.withBadger);
    this._generations = 0;
    this._world.init();
    this.clearFieldPrivate();
    this.drawAllPrivate();
  };

  private btnResetClick = (): void => {
    // Ensure canvas is properly set up on reset
    this.setupCanvas();
    this.init();
    this._initialized = true;
    this.viewEnable();
  };

  private btnRunClick = (): void => {
    // Stop any other running simulations
    for (let i = 0; i < this._allBtnStops.length; i++) {
      this._allBtnStops[i].click();
    }

    this._running = true;
    this._cycleTimer = window.setInterval(this.worldCycle, 500);
    this.viewEnable();
  };

  private btnStopClick = (): void => {
    window.clearInterval(this._cycleTimer);
    this._running = false;
    this.viewEnable();
  };

  private btnSingleStepClick = (): void => {
    this._running = true;
    this.viewEnable();
    this.worldCycle();
    this._running = false;
    this.viewEnable();
  };

  private btnEarthquakeClick = (): void => {
    if (this._world) {
      this._world.earthquake();
      this.clearFieldPrivate();
      this.drawAllPrivate();
    }
  }

  private viewEnable = (): void => {
    this._txtNumSources.disabled = this._running;
    this._btnReset.disabled = this._running;
    this._btnRun.disabled = this._running || !this._initialized;
    this._btnStop.disabled = !this._running || !this._initialized;
    this._btnEarthquake.disabled = !this._initialized;
    this._btnSingleStep.disabled = this._running || !this._initialized;
  };

  private drawAllPrivate = (): void => {
    if (!this._world) return;

    this.DrawSources();
    this.DrawCorners();
    this.DrawPaths();
    if (this.withBadger) {
      this.DrawBadger();
    }
    this.displayValuesPrivate();
  };

  private worldCycle = (): void => {
    if (!this._world) return;

    this._generations++;
    this._world.worldCycle();
    this.clearFieldPrivate();
    this.drawAllPrivate();
  };

  private clearFieldPrivate = (): void => {
    // Save the current transformation matrix
    this._context.save();
    
    // Reset transformation to clear the entire canvas
    this._context.setTransform(1, 0, 0, 1, 0, 0);
    
    // Clear the entire canvas
    this._context.clearRect(0, 0, this._field.width, this._field.height);
    
    // Restore the transformation matrix
    this._context.restore();
  };

  private DrawSources = (): void => {
    if (!this._world) return;

    this._context.lineWidth = 2;
    this._context.strokeStyle = "green";
    this._context.fillStyle = "green";
    for (const p of this._world.foodSources) {
      this._context.beginPath();
      this._context.arc(p.x, p.y, 10, 0, 2 * Math.PI, false);
      this._context.stroke();
    }
  };

  private DrawCorners = (): void => {
    if (!this._world) return;

    const lineColor = this._isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'black';
    this._context.lineWidth = 2;
    this._context.strokeStyle = lineColor;
    this._context.fillStyle = lineColor;
    for (const c of this._world.stops()) {
      this._context.beginPath();
      this._context.arc(c.x, c.y, 5, 0, 2 * Math.PI, false);
      this._context.fill(); // Use fill for solid dots
    }
  };

  private DrawPaths = (): void => {
    if (!this._world) return;

    const lineColor = this._isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'black';
    this._context.lineWidth = 1;
    this._context.strokeStyle = lineColor;
    for (const l of this._world.paths()) {
      this._context.beginPath();
      this._context.moveTo(l.start.x, l.start.y);
      this._context.lineTo(l.end.x, l.end.y);
      this._context.stroke();
    }
  };

  private DrawBadger = (): void => {
    if (!this._world || !this.withBadger) return;

    this._context.lineWidth = 3;
    this._context.strokeStyle = "red";
    this._context.fillStyle = "red";
    const p = this._world.badger.position;
    this._context.beginPath();
    this._context.arc(p.x, p.y, 12, 0, 2 * Math.PI, false);
    this._context.stroke();
    
    // Add a smaller filled circle inside for visibility
    this._context.beginPath();
    this._context.arc(p.x, p.y, 6, 0, 2 * Math.PI, false);
    this._context.fill();
  };

  private displayValuesPrivate = (): void => {
    if (!this._world) return;

    // Use explicit methods from SWeaselWorld that provide the values
    const calsSpent = this._world.parentSpentCalories();
    const calsAcquired = this._world.parentAcquiredCalories();

    // Update the UI
    this._lblAcquiredCalories.innerText = calsAcquired.toString();
    this._lblSpentCalories.innerText = calsSpent.toString();
    this._lblNetCalories.innerText = (calsAcquired - calsSpent).toString();
    this._lblGenerations.innerText = this._generations.toString();
  };

  // Public method to access world cycle (for the optimizer)
  public get world(): SWeaselWorld | undefined {
    return this._world;
  }

  // Public methods for the optimizer to call (these delegate to private methods)
  public clearField(): void {
    this.clearFieldPrivate();
  }

  public DrawAll(): void {
    this.drawAllPrivate();
  }

  public DisplayValues(): void {
    this.displayValuesPrivate();
  }

  // Public method to update theme
  public setDarkMode(isDarkMode: boolean): void {
    this._isDarkMode = isDarkMode;
    // Redraw if initialized
    if (this._initialized) {
      this.clearFieldPrivate();
      this.drawAllPrivate();
    }
  }
}