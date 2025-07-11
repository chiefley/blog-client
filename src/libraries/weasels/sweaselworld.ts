// src/libraries/weasels/sweaselworld.ts - Optimized version
import { Point } from './point';
import { Line } from './line';
import { SWeasel } from './sweasel';
import { SBadger } from './sbadger';

export class SWeaselWorld {
  public foodSources: Point[] = [];
  public fittestWeasel: SWeasel;
  private _children: SWeasel[] = [];
  private _childrenPool: SWeasel[] = [];  // Pool of reusable child weasels
  private _gaussian: number[] = [];
  public badger: SBadger;

  // Spatial index for food sources
  private _foodSourceGrid: Map<string, number[]> = new Map();
  private _gridSize = 100; // 100x100 grid cells for 1000x1000 field

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
    
    // Build spatial index for food sources
    this.buildFoodSourceGrid();

    // Pre-calculate gaussian distribution values
    this._gaussian = new Array(10000);
    for (let i = 0; i < 10000; i++) {
      this._gaussian[i] = SWeaselWorld.gaussian(i, 0, 500);
    }

    // Create initial fittest weasel
    this.fittestWeasel = new SWeasel(this.mutationLevel);
    this.fittestWeasel.init(5);

    // Create badger
    this.badger = new SBadger();
  }

  public init = (): void => {
    const childCount = 5000;
    
    // Ensure we have enough weasels in the pool
    while (this._childrenPool.length < childCount) {
      const newWeasel = new SWeasel(this.mutationLevel);
      newWeasel.weaselIx = this._childrenPool.length;
      this._childrenPool.push(newWeasel);
    }

    // Take weasels from the pool and copy the fittest into them
    this._children = [];
    for (let i = 0; i < childCount; i++) {
      const child = this._childrenPool[i];
      child.copyIn(this.fittestWeasel);
      this._children.push(child);
    }
    
    // Invalidate cache to ensure initial values are calculated
    this._lastFitnessWeasel = null;
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

    // Instead of clearing, repopulate children with copies of the new fittest
    for (let i = 0; i < len; i++) {
      this._children[i].copyIn(this.fittestWeasel);
    }
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

    // Rebuild spatial index after moving food sources
    this.buildFoodSourceGrid();

    // Invalidate fitness cache
    this._lastFitnessWeasel = null;
  };

  public parentSpentCalories = (): number => {
    // Recalculate when cache is invalidated
    if (this._lastFitnessWeasel === null) {
      this.recalculateFitness();
    }

    return Math.floor(this._lastSpentCalories);
  };

  public parentAcquiredCalories = (): number => {
    // Recalculate when cache is invalidated
    if (this._lastFitnessWeasel === null) {
      this.recalculateFitness();
    }

    return Math.floor(this._lastAcquiredCalories);
  };

  private recalculateFitness = (): void => {
    // Calculate both values once and cache them
    const spent = this.caloriesSpentWalking(this.fittestWeasel);
    const acquired = this.caloriesAcquired(this.fittestWeasel);
    
    this._lastSpentCalories = spent;
    this._lastAcquiredCalories = acquired;
    this._lastFitnessWeasel = this.fittestWeasel;
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
    
    // Track which food sources have been consumed (without copying array)
    const consumed = new Set<number>();

    // Process each stop in the weasel's path
    for (const stop of stops) {
      if (consumed.size >= this.foodSources.length) {
        break; // All food consumed
      }

      // Use spatial index to find nearby food sources
      const nearbyIndices = this.findNearbyFoodIndices(stop);
      
      // If no nearby food found, search all (fallback)
      const indicesToSearch = nearbyIndices.length > 0 ? nearbyIndices : 
        Array.from({length: this.foodSources.length}, (_, i) => i);

      // Find the closest non-consumed food source using squared distances
      let closestIndex = -1;
      let closestDistanceSquared = Infinity;

      for (const idx of indicesToSearch) {
        if (consumed.has(idx)) continue;
        
        // Use squared distance for comparison (faster)
        const distSquared = stop.rangeFromSquaredApprox(this.foodSources[idx]);
        if (distSquared < closestDistanceSquared) {
          closestDistanceSquared = distSquared;
          closestIndex = idx;
        }
      }

      if (closestIndex !== -1) {
        // Calculate actual distance only for the closest source
        const actualDistance = stop.rangeFrom(this.foodSources[closestIndex]);
        if (actualDistance < 150) { // Only consume if close enough
          // Add calories from this source using actual distance
          cals += this.sourceCalories(actualDistance);
          consumed.add(closestIndex);
        }
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

  private static gaussian(x: number, Mean: number, StdDev: number): number {
    const a = x - Mean;
    return Math.exp(-(a * a) / (2 * StdDev * StdDev));
  }

  private buildFoodSourceGrid(): void {
    this._foodSourceGrid.clear();
    
    for (let i = 0; i < this.foodSources.length; i++) {
      const food = this.foodSources[i];
      const gridX = Math.floor(food.x / this._gridSize);
      const gridY = Math.floor(food.y / this._gridSize);
      const key = `${gridX},${gridY}`;
      
      if (!this._foodSourceGrid.has(key)) {
        this._foodSourceGrid.set(key, []);
      }
      this._foodSourceGrid.get(key)!.push(i); // Store index instead of Point
    }
  }

  private findNearbyFoodIndices(point: Point, searchRadius: number = 150): number[] {
    const gridRadius = Math.ceil(searchRadius / this._gridSize);
    const centerX = Math.floor(point.x / this._gridSize);
    const centerY = Math.floor(point.y / this._gridSize);
    
    const nearbyIndices: number[] = [];
    
    // Search in surrounding grid cells
    for (let dx = -gridRadius; dx <= gridRadius; dx++) {
      for (let dy = -gridRadius; dy <= gridRadius; dy++) {
        const key = `${centerX + dx},${centerY + dy}`;
        const indices = this._foodSourceGrid.get(key);
        if (indices) {
          nearbyIndices.push(...indices);
        }
      }
    }
    
    return nearbyIndices;
  }
}