class DWeaselVm {
    private _defaultString: string = "Methinks it is like a weasel.";
    private _world: DWeaselWorld;
    private _generations: number;
    private _cycleTimer: number;
    private _initialized: boolean;
    private _running: boolean;
    private _targetString: string;
    
    private _txtTargetString: HTMLInputElement;
    private _divResultsArea: HTMLTextAreaElement;
    private _btnReset: HTMLButtonElement;
    private _btnRun: HTMLButtonElement;
    private _btnStop: HTMLButtonElement;
    private _lblGenerations: HTMLSpanElement;
    
    private _allBtnStops: NodeListOf<HTMLButtonElement>;

    constructor (dw: HTMLDivElement) {
        this._txtTargetString = <HTMLInputElement> dw.querySelector("#txtTargetString");
        this._divResultsArea = <HTMLTextAreaElement> dw.querySelector("#dwResultsArea");
        this._btnReset = <HTMLButtonElement> dw.querySelector(".btnReset");
        this._btnRun = <HTMLButtonElement> dw.querySelector(".btnRun");
        this._btnStop = <HTMLButtonElement> dw.querySelector(".btnStop");
        this._lblGenerations = <HTMLSpanElement> dw.querySelector(".lblGenerations");
        this._allBtnStops = <HTMLCollectionOf<HTMLButtonElement>> document.getElementsByClassName("btnStop");
       
        this._txtTargetString.onkeyup = () => { this.txtTargetString_changed(); };
        this._btnReset.onclick = () => { this.btnReset_click(); };
        this._btnRun.onclick = () => { this.btnRun_click(); };
        this._btnStop.onclick = () => { this.btnStop_click(); };
        
        
        this._divResultsArea.readOnly = true;
        
        this._running = false;
        this._initialized = false;
        this._generations = 0;
        
        this._txtTargetString.value = this._defaultString;
        this.viewEnable();
        
    };
    
    public init = () => {
        if (this._txtTargetString.value === "") {
            this._txtTargetString.value === this._defaultString;
        }
        
        this._targetString = this._txtTargetString.value;
        let nrCharsInStartString = Math.floor(Math.random() * 5) + 1;
        this._world = new DWeaselWorld(this._targetString, DWeasel.randomString());
        
        this._world.init();
        this._generations = 0;
        this._divResultsArea.value = "";
        this.viewEnable();
    };
    
    private txtTargetString_changed = () => { 
        this._initialized = false;
        this.viewEnable();
    }
    
    private btnReset_click = () => {
        this.init();
        this._initialized = true;
        this.viewEnable();
    };
    
    private btnRun_click = () => {
        for (let i = 0; i < this._allBtnStops.length; i++)
            this._allBtnStops[i].click();        
        
        this._running = true;
        this._cycleTimer = setInterval(this.worldCycle, 500);
        this.viewEnable();
    };
    
    private btnStop_click = () => {
        clearInterval(this._cycleTimer);
        this._running = false;
        this.viewEnable();
    };
    
    private viewEnable = () => {
        this._txtTargetString.disabled = (this._running);
        this._btnReset.disabled = (this._running);
        this._btnRun.disabled = (this._running || !this._initialized);
        this._btnStop.disabled = (!this._running || !this._initialized);
    };
    
    private worldCycle = () => {
        this._generations++;
        this._world.worldCycle();
        this.addResult();
    };
    
    private addResult = () => {
        this._divResultsArea.value =
            this._world.bestDna()
            + ` (${this._generations})`
            + "\r\n"
            + this._divResultsArea.value;
    };
}