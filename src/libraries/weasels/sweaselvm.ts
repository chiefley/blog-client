class SWeaselVm {
    private _world: SWeaselWorld;
    private _context: CanvasRenderingContext2D;
    private _cycleTimer: number;
    private _running: boolean;
    private _initialized: boolean;
    private _generations: number;

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

    constructor(private ww: HTMLElement, private mutationLevel: number, private withBadger: boolean) {
        this._field = <HTMLCanvasElement>ww.querySelector(".field");
        this._txtNumSources = <HTMLInputElement>ww.querySelector(".txtNumSources");
        this._btnReset = <HTMLButtonElement>ww.querySelector(".btnReset");
        this._btnRun = <HTMLButtonElement>ww.querySelector(".btnRun");
        this._btnStop = <HTMLButtonElement>ww.querySelector(".btnStop");
        this._btnEarthquake = <HTMLButtonElement>ww.querySelector(".btnEarthquake");
        this._lblGenerations = <HTMLSpanElement>ww.querySelector(".lblGenerations");
        this._lblSpentCalories = <HTMLSpanElement>ww.querySelector(".lblSpentCalories");
        this._lblAcquiredCalories = <HTMLSpanElement>ww.querySelector(".lblAcquiredCalories");
        this._lblNetCalories = <HTMLSpanElement>ww.querySelector(".lblNetCalories");
        this._allBtnStops = <HTMLCollectionOf<HTMLButtonElement>>document.getElementsByClassName("btnStop");

        this._btnSingleStep = <HTMLButtonElement>ww.querySelector(".btnSingleStep");

        this._context = this._field.getContext("2d");
        this._context.scale(this._field.clientWidth / 1000, this._field.clientHeight / 1000);
        this._context.clearRect(0, 0, 1000, 1000);
        this._context.font = "30px Arial";

        this._btnReset.onclick = () => { this.btnResetClick(); };
        this._btnRun.onclick = () => { this.btnRunClick(); };
        this._btnStop.onclick = () => { this.btnStopClick(); };
        this._btnEarthquake.onclick = () => { this.btnEarthquakeClick(); };
        this._txtNumSources.value = "15";

        this._btnSingleStep.onclick = () => { this.btnSingleStepClick(); };

        this._running = false;
        this._initialized = false;
        this._generations = 0;
        this.viewEnable();
    }

    private init = () => {
        if (this._txtNumSources.value === "")
            this._txtNumSources.value = "15";

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

    private btnResetClick = () => {
        this.init();
        this._initialized = true;
        this.viewEnable();
    };

    private btnRunClick = () => {
        for (let i = 0; i < this._allBtnStops.length; i++)
            this._allBtnStops[i].click();

        this._running = true;
        this._cycleTimer = setInterval(this.worldCycle, 500);
        this.viewEnable();
    };

    private btnStopClick = () => {
        clearInterval(this._cycleTimer);
        this._running = false;
        this.viewEnable();
    };

    private btnSingleStepClick = () => {
        this._running = true;
        this.viewEnable();
        this.worldCycle();
        this._running = false;
        this.viewEnable();
    };

    private btnEarthquakeClick = () => {
        this._world.earthquake();
    }

    private viewEnable = () => {
        this._txtNumSources.disabled = (this._running);
        this._btnReset.disabled = (this._running);
        this._btnRun.disabled = (this._running || !this._initialized);
        this._btnStop.disabled = (!this._running || !this._initialized);
        this._btnEarthquake.disabled = (!this._running || !this._initialized);
    };

    private DrawAll = () => {
        this.DrawSources();
        this.DrawCorners();
        this.DrawPaths();
        if (this.withBadger)
            this.DrawBadger();
        this.DisplayValues();
    };

    private worldCycle = () => {
        this._generations++;
        this._world.worldCycle();
        this.clearField();
        this.DrawAll();
    };

    private clearField = () => {
        this._context.clearRect(0, 0, 1000, 1000);
    };

    private DrawSources = () => {
        this._context.lineWidth = 2;
        this._context.strokeStyle = "green";
        for (let p of this._world.foodSources) {
            this._context.beginPath();
            this._context.arc(p.x, p.y, 10, 0, 2 * Math.PI, false);
            this._context.stroke();
        }
    };

    private DrawCorners = () => {
        this._context.lineWidth = 2;
        this._context.strokeStyle = "black";
        this._context.fillStyle = "black";
        for (let c of this._world.stops()) {
            this._context.beginPath();
            this._context.arc(c.x, c.y, 5, 0, 2 * Math.PI, false);
            this._context.stroke();
        }
    };

    private DrawPaths = () => {
        this._context.lineWidth = 1;
        this._context.strokeStyle = "black";
        for (let l of this._world.paths()) {
            this._context.beginPath();
            this._context.moveTo(l.start.x, l.start.y);
            this._context.lineTo(l.end.x, l.end.y);
            this._context.stroke();
        }
    };

    private DrawBadger = () => {
        this._context.lineWidth = 2;
        this._context.strokeStyle = "red";
        let p = this._world.badger.position;
        this._context.beginPath();
        this._context.arc(p.x, p.y, 10, 0, 2 * Math.PI, false);
        this._context.stroke();

    };

    private DisplayValues = () => {
        let calsSpent = this._world.parentSpentCalories();
        let calsAcquired = this._world.parentAcquiredCalories();
        this._lblAcquiredCalories.innerText = calsAcquired.toString();
        this._lblSpentCalories.innerText = calsSpent.toString();
        this._lblNetCalories.innerText = (calsAcquired - calsSpent).toString();
        this._lblGenerations.innerText = this._generations.toString();
    };
}