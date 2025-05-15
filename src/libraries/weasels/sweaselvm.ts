// sweaselvm.ts - View model that connects the simulation to the UI
import { SWeaselWorld } from './sweaselworld';

export class SWeaselVm {
  private _world: SWeaselWorld | undefined;
  private _context: CanvasRenderingContext2D;
  private _cycleTimer: number = 0;
  private _running: boolean = false;
  private _initialized: boolean = false;
  private _generations: number = 0;

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

  constructor(containerElem: HTMLElement, private mutationLevel: number, private withBadger: boolean) {
    // Get UI elements
    this._field = containerElem.querySelector(".field") as HTMLCanvasElement;
    this._txtNumSources = containerElem.querySelector(".txtNumSources") as HTMLInputElement;
    this._btnReset = containerElem.querySelector(".btnReset") as HTMLButtonElement;
    this._btnRun = containerElem.querySelector(".btnRun") as HTMLButtonElement;
    this._btnStop = containerElem.querySelector(".btnStop") as HTMLButtonElement;
    this._btnEarthquake = containerElem.querySelector(".btnEarthquake") as HTMLButtonElement;
    this._lblGenerations = containerElem.querySelector(".lblGenerations") as HTMLSpanElement;
    this._lblSpentCalories = containerElem.querySelector(".lblSpentCalories") as HTMLSpanElement;
    this._lblAcquiredCalories = containerElem.querySelector(".lblAcquiredCalories") as HTMLSpanElement;
    this._lblNetCalories = containerElem.querySelector(".lblNetCalories") as HTMLSpanElement;
    this._allBtnStops = document.getElementsByClassName("btnStop") as HTMLCollectionOf<HTMLButtonElement>;
    this._btnSingleStep = containerElem.querySelector(".btnSingleStep") as HTMLButtonElement;

    // Initialize the canvas
    const ctx = this._field.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    this._context = ctx;
    this._context.scale(this._field.clientWidth / 1000, this._field.clientHeight / 1000);
    this._context.clearRect(0, 0, 1000, 1000);
    this._context.font = "30px Arial";

    // Set up event handlers
    this._btnReset.onclick = () => { this.btnResetClick(); };
    this._btnRun.onclick = () => { this.btnRunClick(); };
    this._btnStop.onclick = () => { this.btnStopClick(); };
    this._btnEarthquake.onclick = () => { this.btnEarthquakeClick(); };
    this._btnSingleStep.onclick = () => { this.btnSingleStepClick(); };

    // Set initial source count
    this._txtNumSources.value = "15";

    // Initialize state
    this._running = false;
    this._initialized = false;
    this._generations = 0;
    this.viewEnable();
  }

  private init = (): void => {
    if (this._txtNumSources.value === "") {
      this._txtNumSources.value = "15";
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
    this.clearField();
    this.DrawAll();
  };

  private btnResetClick = (): void => {
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
      this.clearField();
      this.DrawAll();
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

  private DrawAll = (): void => {
    if (!this._world) return;

    this.DrawSources();
    this.DrawCorners();
    this.DrawPaths();
    if (this.withBadger) {
      this.DrawBadger();
    }
    this.DisplayValues();
  };

  private worldCycle = (): void => {
    if (!this._world) return;

    this._generations++;
    this._world.worldCycle();
    this.clearField();
    this.DrawAll();
  };

  private clearField = (): void => {
    this._context.clearRect(0, 0, 1000, 1000);
  };

  private DrawSources = (): void => {
    if (!this._world) return;

    this._context.lineWidth = 2;
    this._context.strokeStyle = "green";
    for (let p of this._world.foodSources) {
      this._context.beginPath();
      this._context.arc(p.x, p.y, 10, 0, 2 * Math.PI, false);
      this._context.stroke();
    }
  };

  private DrawCorners = (): void => {
    if (!this._world) return;

    this._context.lineWidth = 2;
    this._context.strokeStyle = "black";
    this._context.fillStyle = "black";
    for (let c of this._world.stops()) {
      this._context.beginPath();
      this._context.arc(c.x, c.y, 5, 0, 2 * Math.PI, false);
      this._context.stroke();
    }
  };

  private DrawPaths = (): void => {
    if (!this._world) return;

    this._context.lineWidth = 1;
    this._context.strokeStyle = "black";
    for (let l of this._world.paths()) {
      this._context.beginPath();
      this._context.moveTo(l.start.x, l.start.y);
      this._context.lineTo(l.end.x, l.end.y);
      this._context.stroke();
    }
  };

  private DrawBadger = (): void => {
    if (!this._world || !this.withBadger) return;

    this._context.lineWidth = 2;
    this._context.strokeStyle = "red";
    let p = this._world.badger.position;
    this._context.beginPath();
    this._context.arc(p.x, p.y, 10, 0, 2 * Math.PI, false);
    this._context.stroke();
  };

  private DisplayValues = (): void => {
    if (!this._world) return;

    let calsSpent = this._world.parentSpentCalories();
    let calsAcquired = this._world.parentAcquiredCalories();
    this._lblAcquiredCalories.innerText = calsAcquired.toString();
    this._lblSpentCalories.innerText = calsSpent.toString();
    this._lblNetCalories.innerText = (calsAcquired - calsSpent).toString();
    this._lblGenerations.innerText = this._generations.toString();
  };
}