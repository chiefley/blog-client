// src/libraries/weasels/sweasel.ts - Optimized version
import { Dna } from './dna';
import { Gene } from './gene';
import { Point } from './point';
import { Line } from './line';

export class SWeasel {
  private _dna: Dna | undefined;
  private _mutationType: number = 0;
  public weaselIx: number = 0;
  private _stopsCache: Point[] | null = null;
  private _pathsCache: Line[] | null = null;
  private _modified: boolean = true;

  constructor(private _mutationLevel: number) {
  }

  public init = (stops: number): void => {
    this._dna = new Dna();
    this._dna.init(stops);
    this._modified = true;
    this._stopsCache = null;
    this._pathsCache = null;
  };

  public stops = (): Point[] => {
    if (!this._dna) {
      return [];
    }

    // Use cache if available and not modified
    if (!this._modified && this._stopsCache) {
      return this._stopsCache;
    }

    // Update cache
    this._stopsCache = this._dna.stops();
    return this._stopsCache;
  };

  public paths = (): Line[] => {
    if (!this._dna) {
      return [];
    }

    // Use cache if available and not modified
    if (!this._modified && this._pathsCache) {
      return this._pathsCache;
    }

    // Update cache and reset modified flag
    this._pathsCache = this._dna.paths();
    this._modified = false;
    return this._pathsCache;
  };

  public isAlive = (): boolean => {
    return (this._dna !== undefined) && this._dna.isValidTree();
  };

  public copyIn = (inWeasel: SWeasel): void => {
    if (!inWeasel._dna) {
      throw new Error("Source weasel has no DNA");
    }

    if (typeof this._dna === "undefined") {
      this._dna = new Dna();
    }
    this._dna.copyIn(inWeasel._dna);

    // Invalidate all caches when copying
    this._modified = true;
    this._stopsCache = null;
    this._pathsCache = null;
  };

  public mutate = (): void => {
    if (!this._dna) {
      return;
    }

    // Generate a random number of mutations between 1 and 3
    const nrMutations = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < nrMutations; i++) {
      this._mutationType = Math.floor(Math.random() * this._mutationLevel);
      switch (this._mutationType) {
        case 0:
          this.randomMoveStop();
          break;
        case 1:
          this.randomAddStop();
          break;
        case 2:
          this.randomDeleteStop();
          break;
        case 3:
          this.randomMovePath();
          break;
        case 4:
          this.randomInsertStop();
          break;
      }
    }

    // Note: Cache invalidation is now handled within each mutation method
  };

  private randomMovePath = (): void => {
    if (!this._dna) {
      return;
    }

    // Skip if not enough genes to move paths around
    if (this._dna.genes.length < 2) {
      return;
    }

    let geneToMove: Gene;
    let newParent: Gene;
    let attempts = 0;

    try {
      // Find a non-root gene to move
      do {
        geneToMove = this._dna.randomGene();
        attempts++;
        if (attempts > 10) {
          return; // Prevent infinite loop
        }
      } while (geneToMove.isRoot());

      attempts = 0;
      // Find a different gene to be the new parent
      do {
        newParent = this._dna.randomGene();
        attempts++;
        if (attempts > 10) {
          return; // Prevent infinite loop
        }
      } while (newParent === geneToMove);

      this._dna.moveGeneToNewParent(geneToMove, newParent);
      // Moving paths affects paths cache but not stops
      this._pathsCache = null;
      this._modified = true;
    } catch (e) {
      console.error("Error in randomMovePath:", e);
    }
  };

  private randomMoveStop = (): void => {
    if (!this._dna) {
      return;
    }

    try {
      let geneToMove = this._dna.randomGene();
      geneToMove.stop.randomMove(50);
      // Moving a stop affects paths that connect to it
      this._pathsCache = null;
      // Stops cache remains valid - same stops, different positions
      this._modified = true;
    } catch (e) {
      console.error("Error in randomMoveStop:", e);
    }
  };

  private randomAddStop = (): void => {
    if (!this._dna) {
      return;
    }

    try {
      let parentGene = this._dna.randomGene();
      let newGene = this._dna.addNewGene();
      newGene.addToParent(parentGene);
      // Adding a stop affects both caches
      this._stopsCache = null;
      this._pathsCache = null;
      this._modified = true;
    } catch (e) {
      console.error("Error in randomAddStop:", e);
    }
  };

  private randomDeleteStop = (): void => {
    if (!this._dna) {
      return;
    }

    // Skip if we're down to minimum number of genes
    if (this._dna.genes.length <= 2) {
      return;
    }

    try {
      let aGene: Gene;
      let attempts = 0;
      do {
        aGene = this._dna.randomGene();
        attempts++;
        if (attempts > 10) {
          return; // Prevent infinite loop
        }
      } while (aGene.isRoot());

      this._dna.deleteGene(aGene);
      // Deleting a stop affects both caches
      this._stopsCache = null;
      this._pathsCache = null;
      this._modified = true;
    } catch (e) {
      console.error("Error in randomDeleteStop:", e);
    }
  };

  private randomInsertStop = (): void => {
    if (!this._dna) {
      return;
    }

    try {
      let aGene: Gene;
      let attempts = 0;

      // Try to find a gene that is neither root nor leaf
      do {
        aGene = this._dna.randomGene();
        attempts++;
        if (attempts > 10) {
          return; // Prevent infinite loop
        }
      } while ((aGene.isRoot() || this._dna.isLeaf(aGene)));

      if (aGene.parent) {
        let newGene = this._dna.addNewGene();
        let parentGene = aGene.parent;

        // Insert the new gene between the parent and the current gene
        aGene.parent = newGene;
        newGene.parent = parentGene;
        // Inserting a stop affects both caches
        this._stopsCache = null;
        this._pathsCache = null;
        this._modified = true;
      }
    } catch (e) {
      console.error("Error in randomInsertStop:", e);
    }
  };
}