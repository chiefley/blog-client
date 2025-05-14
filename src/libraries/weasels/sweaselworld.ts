// sweaselworld.ts - Represents the environment for the weasels
import { Point } from './point';
import { Line } from './line';
import { SWeasel } from './sweasel';
import { SBadger } from './sbadger';

export class SWeaselWorld {
  public foodSources: Point[] = [];
  public fittestWeasel: SWeasel;
  private _children: SWeasel[] = [];
  private _gaussian: number[] = [];
  public badger: SBadger = new SBadger(); // Initialize to avoid 'not definitely assigned' error

  constructor(sources: number, private mutationLevel: number, private withBadger: boolean) {
    // Create food sources
    this.foodSources = [];
    for (let i: number = 0; i < sources; i++) {
      this.foodSources[i] = this.randomLocation();
    }

    // Pre-calculate gaussian distribution values
    this._gaussian = [];
    for (let i = 0; i < 10000; i++) {
      this._gaussian.push(this.gaussian(i, 0, 500));
    }

    // Create initial fittest weasel
    this.fittestWeasel = new SWeasel(this.mutationLevel);
    this.fittestWeasel.init(5);

    // Create badger if needed
    if (this.withBadger) {
      this.badger = new SBadger();
    }
  }

  public init = (): void => {
    // Create child weasels based on the fittest
    this._children = [];
    for (let i = 0; i < 5000; i++) {
      this._children[i] = new SWeasel(this.mutationLevel);
      this._children[i].weaselIx = i;
      this._children[i].copyIn(this.fittestWeasel);
    }
  };

  public stops = (): Point[] => this.fittestWeasel.stops();
  public paths = (): Line[] => this.fittestWeasel.paths();

  public worldCycle = (): void => {
    // Move badger if it exists
    if (this.withBadger) {
      this.badger.moveRandom();
    }

    // Reinitialize if needed
    if (this._children.length === 0) {
      this.init();
    }

    let maxCals = Number.NEGATIVE_INFINITY;
    let maxIx = -1;

    // Find the fittest weasel among children
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

    // Update the fittest weasel if we found a better one
    if ((maxIx > -1) && this._children[maxIx].isAlive()) {
      this.fittestWeasel.copyIn(this._children[maxIx]);
    }

    // Clear children for next cycle
    this._children = [];
  };

  public earthquake = (): void => {
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
      - badgerPenalty;
  };

  private caloriesSpentWalking = (weas: SWeasel): number => {
    let cals = 0;
    for (let p of weas.paths()) {
      cals += p.length();
    }
    return cals;
  };

  private caloriesSpentFightingBadger = (weas: SWeasel): number => {
    if (!this.withBadger) {
      return 0;
    }

    let calories = 0;
    for (let p of weas.paths()) {
      let distance = p.pointRangeFromLine(this.badger.position);
      // Ensure distance is within bounds of our pre-calculated values
      if (distance >= 0 && distance < this._gaussian.length) {
        let cals = this._gaussian[distance];
        calories = (cals > calories) ? cals : calories;
      }
    }
    return calories * 20000;
  };

  private caloriesAcquired = (weas: SWeasel): number => {
    let cals = 0;
    let sources = this.foodSources.slice(0); // Create a copy of food sources

    // Process each stop in the weasel's path
    for (let c of weas.stops()) {
      if (sources.length === 0) {
        break;
      }

      // Sort sources by distance to current stop
      let sortedSources = sources.sort((p1: Point, p2: Point): number => {
        return c.rangeFrom(p1) - c.rangeFrom(p2);
      });

      let closestSource = sortedSources[0];
      cals += this.sourceCalories(c.rangeFrom(closestSource));

      // Remove the consumed source
      let closestSourceIx = this.indexOfPoint(sources, closestSource);
      if (closestSourceIx >= 0) {
        sources.splice(closestSourceIx, 1);
      }
    }
    return cals;
  };

  private sourceCalories = (range: number): number => {
    // Ensure range is within bounds of our pre-calculated values
    const validRange = Math.min(Math.max(0, Math.floor(range)), this._gaussian.length - 1);
    return this._gaussian[validRange] * 15000;
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
    for (let i = 0; i < points.length; i++) {
      if (points[i].rangeFrom(point) === 0) {
        return i;
      }
    }
    return -1;
  };

  private gaussian = (x: number, Mean: number, StdDev: number): number => {
    let a = x - Mean;
    return Math.exp(-(a * a) / (2 * StdDev * StdDev));
  };
}