// src/libraries/weasels/sweaselworld.ts - Optimized version
import { Point } from './point';
import { Line } from './line';
import { SWeasel } from './sweasel';
import { SBadger } from './sbadger';

export class SWeaselWorld {
  public foodSources: Point[] = [];
  public fittestWeasel: SWeasel;
  private _children: SWeasel[] = [];
  private _gaussian: number[] = [];
  public badger: SBadger;

  // Cache for fitness calculations
  private _lastFitnessWeasel: SWeasel | null = null;
  private _lastSpentCalories = 0;
  private _lastAcquiredCalories = 0;

  constructor(sources: number, private mutationLevel: number, private withBadger: boolean) {
    // Preallocate food sources array
    this.foodSources = new Array(sources);
    for (let i = 0; i < sources; i++) {
      this.foodSources[i] = this.randomLocation();
    }

    // Pre-calculate gaussian distribution values
    this._gaussian = new Array(10000);
    for (let i = 0; i < 10000; i++) {
      this._gaussian[i] = this.gaussian(i, 0, 500);
    }

    // Create initial fittest weasel
    this.fittestWeasel = new SWeasel(this.mutationLevel);
    this.fittestWeasel.init(5);

    // Create badger
    this.badger = new SBadger();
  }

  public init = (): void => {
    // Create child weasels based on the fittest
    // Preallocate children array for better performance
    const childCount = 5000;
    this._children = new Array(childCount);

    for (let i = 0; i < childCount; i++) {
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
    const len = this._children.length;
    for (let i = 0; i < len; i++) {
      this._children[i].mutate();
      if (this._children[i].isAlive()) {
        const netCals = this.netCalories(this._children[i]);
        if (netCals > maxCals) {
          maxCals = netCals;
          maxIx = i;
        }
      }
    }

    // Update the fittest weasel if we found a better one
    if ((maxIx > -1) && this._children[maxIx].isAlive()) {
      this.fittestWeasel.copyIn(this._children[maxIx]);

      // Invalidate fitness cache since we have a new fittest weasel
      this._lastFitnessWeasel = null;
    }

    // Clear children for next cycle
    this._children = [];
  };

  public earthquake = (): void => {
    const foodCount = this.foodSources.length;
    const nrSourcesToMove = Math.floor(Math.random() * foodCount);

    for (let i = 0; i < nrSourcesToMove; i++) {
      const sourceToMoveIx = Math.floor(Math.random() * foodCount);
      do {
        this.foodSources[sourceToMoveIx].randomMove(300);
      } while (!this.isInField(this.foodSources[sourceToMoveIx]));
    }

    // Invalidate fitness cache
    this._lastFitnessWeasel = null;
  };

  public parentSpentCalories = (): number => {
    // Use cached value if available
    if (this._lastFitnessWeasel === this.fittestWeasel) {
      return Math.floor(this._lastSpentCalories);
    }

    const spent = this.caloriesSpentWalking(this.fittestWeasel);

    // Cache the result
    if (this._lastFitnessWeasel !== this.fittestWeasel) {
      this._lastFitnessWeasel = this.fittestWeasel;
      this._lastSpentCalories = spent;
      // We'll calculate acquired calories on demand
    }

    return Math.floor(spent);
  };

  public parentAcquiredCalories = (): number => {
    // Use cached value if available
    if (this._lastFitnessWeasel === this.fittestWeasel) {
      return Math.floor(this._lastAcquiredCalories);
    }

    const acquired = this.caloriesAcquired(this.fittestWeasel);

    // Cache the result
    if (this._lastFitnessWeasel !== this.fittestWeasel) {
      this._lastFitnessWeasel = this.fittestWeasel;
      this._lastAcquiredCalories = acquired;
      // We'll calculate spent calories on demand
    }

    return Math.floor(acquired);
  };

  private netCalories = (weas: SWeasel): number => {
    // Only calculate the components we need
    const acquired = this.caloriesAcquired(weas);
    const spent = this.caloriesSpentWalking(weas);
    let badgerPenalty = 0;

    if (this.withBadger) {
      badgerPenalty = this.caloriesSpentFightingBadger(weas);
    }

    // Cache results if this is the fittest weasel
    if (weas === this.fittestWeasel) {
      this._lastFitnessWeasel = weas;
      this._lastSpentCalories = spent;
      this._lastAcquiredCalories = acquired;
    }

    return acquired - spent - badgerPenalty;
  };

  private caloriesSpentWalking = (weas: SWeasel): number => {
    let cals = 0;
    const paths = weas.paths();
    const len = paths.length;

    for (let i = 0; i < len; i++) {
      cals += paths[i].length();
    }

    return cals;
  };

  private caloriesSpentFightingBadger = (weas: SWeasel): number => {
    if (!this.withBadger) {
      return 0;
    }

    let calories = 0;
    const paths = weas.paths();
    const badgerPos = this.badger.position;
    const len = paths.length;

    for (let i = 0; i < len; i++) {
      const distance = paths[i].pointRangeFromLine(badgerPos);

      // Ensure distance is within bounds of our pre-calculated values
      if (distance >= 0 && distance < this._gaussian.length) {
        const cals = this._gaussian[distance];
        calories = (cals > calories) ? cals : calories;
      }
    }

    return calories * 20000;
  };

  private caloriesAcquired = (weas: SWeasel): number => {
    let cals = 0;
    const stops = weas.stops();

    // Create a copy of food sources for this calculation
    const sources = this.foodSources.slice(0);

    // Process each stop in the weasel's path
    for (const c of stops) {
      if (sources.length === 0) {
        break;
      }

      // Find the closest food source
      let closestSource = sources[0];
      let closestDistance = c.rangeFrom(closestSource);

      for (let i = 1; i < sources.length; i++) {
        const dist = c.rangeFrom(sources[i]);
        if (dist < closestDistance) {
          closestDistance = dist;
          closestSource = sources[i];
        }
      }

      // Add calories from this source
      cals += this.sourceCalories(closestDistance);

      // Remove the consumed source
      const closestSourceIx = sources.indexOf(closestSource);
      if (closestSourceIx >= 0) {
        // Faster array removal by swapping with last element
        sources[closestSourceIx] = sources[sources.length - 1];
        sources.pop();
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
    const px = Math.random() * 1000;
    const py = Math.random() * 1000;
    return new Point(px, py);
  };

  private isInField = (point: Point): boolean => {
    return (point.x >= 0)
      && (point.x <= 1000)
      && (point.y >= 0)
      && (point.y <= 1000);
  }

  private gaussian = (x: number, Mean: number, StdDev: number): number => {
    const a = x - Mean;
    return Math.exp(-(a * a) / (2 * StdDev * StdDev));
  };
}