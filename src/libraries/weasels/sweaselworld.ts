class SWeaselWorld {
    public foodSources: Point[];
    public fittestWeasel: SWeasel;
    private _children: SWeasel[];
    private _gaussian: number[];
    public  badger: SBadger;
    private _badgerState: number;

    constructor(sources: number, private mutationLevel: number, private withBadger: boolean) {
        this.foodSources = [];
        for (let i: number = 0; i < sources; i++) {
            this.foodSources[i] = this.randomLocation();
        }

        this._gaussian = [];
        for (let i = 0; i < 10000; i++) {
            this._gaussian.push(this.gaussian(i, 0, 500));
        }

        this.fittestWeasel = new SWeasel(this.mutationLevel);
        this.fittestWeasel.init(5);
        if (this.withBadger)
            this.badger = new SBadger();
    };
    
    public init = () => {
        
        this._children = [];
        for (let i = 0; i < 5000; i++) {
            this._children[i] = new SWeasel(this.mutationLevel);
            this._children[i].weaselIx = i;
            this._children[i].copyIn(this.fittestWeasel);
        }
    };

    public stops = () => this.fittestWeasel.stops();
    public paths =() => this.fittestWeasel.paths();
    
    public worldCycle = () => {
        if (this.withBadger)
            this.badger.moveRandom();
        
        if (this._children.length == 0) 
            this.init();
            
        let maxCals = 0;
        let maxIx = -1;

        for (let i = 0; i < this._children.length; i++) {
            this._children[i].mutate();
            if (this._children[i].isAlive()) {
                let netCals = this.netCalories(this._children[i]);
                if (netCals > maxCals) {
                    maxCals = netCals;
                    maxIx = i;
                }
            }
        }

         if ((maxIx > -1) && (this._children[0].isAlive()))
              this.fittestWeasel.copyIn(this._children[maxIx]);
        this._children = [];
    };
    
    public earthquake = () => {
        let nrSourcesToMove = Math.floor(Math.random() * this.foodSources.length);
        for (let i = 0; i < nrSourcesToMove; i++) {
            let sourceToMoveIx = Math.floor(Math.random() * this.foodSources.length);
            do {
                this.foodSources[sourceToMoveIx].randomMove(300);
            } while (!this.isInField(this.foodSources[sourceToMoveIx]));
        }
    };
    
    public parentSpentCalories = (): number => {
        return Math.floor(this.caloriesSpentWalking(this.fittestWeasel));
    };
    
    public parentAcquiredCalories = (): number => {
        return Math.floor(this.caloriesAcquired(this.fittestWeasel));
    };

    private netCalories = (weas: SWeasel): number => {
        let badgerPenalty = (this.withBadger) 
            ? this.caloriesSpentFightingBadger(weas)
            : 0;
            
        return this.caloriesAcquired(weas) 
            - this.caloriesSpentWalking(weas)
            - badgerPenalty
            ;
    };

    private caloriesSpentWalking = (weas: SWeasel): number => {
        let cals = 0;
        for (let p of weas.paths())
            cals += p.length();
        return cals;
    };
    
    private caloriesSpentFightingBadger = (weas: SWeasel): number => {
        let calories = 0;
        for (let p of weas.paths()) {
            let distance = p.pointRangeFromLine(this.badger.position);
            let cals = this._gaussian[distance];
            calories = (cals > calories)
                ? cals
                : calories;
        }
        return calories * 20000;
    };
    
    private caloriesAcquired = (weas: SWeasel): number => {
        let cals = 0;
        let sources = this.foodSources.slice(0);
        for (let c of weas.stops())
        {
            let sortedSources = sources.sort(function(p1: Point, p2: Point): number {
                return c.rangeFrom(p1) - c.rangeFrom(p2);
            });
            
            let closestSource = sortedSources[0];
            cals += this.sourceCalories(c.rangeFrom(closestSource));
            
            let closestSourceIx = this.indexOfPoint(sources, closestSource);
            sources.splice(closestSourceIx, 1);
            if (sources.length === 0)
                break;
        }
        return cals;
    };
    
    private sourceCalories = (range: number): number => {
        return this._gaussian[Math.floor(range)] * 15000;
    };

    private randomLocation = (): Point => {
        let px = Math.random() * 1000;
        let py = Math.random() * 1000;
        return new Point(px, py);
    };
    
    private isInField = (point: Point): boolean => {
        return (point.x >= 0)
            && (point.x <= 1000)
            && (point.y >= 0)
            && (point.y <= 1000);
    }
    
    private indexOfPoint = (points: Point[], point: Point): number => {
        let ix = -1;
        for (let i = 0; i < points.length; i++) {
            if (points[i].rangeFrom(point) === 0) {
                ix = i;
                break;
            }
        }
        return ix;
    };
    
    
    private gaussian = ( x: number, Mean: number, StdDev: number ): number => {
        let a = x - Mean;
        return Math.exp( -( a * a ) / ( 2 * StdDev * StdDev ) ) ;
  };
  
  
}
