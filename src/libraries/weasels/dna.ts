// src/libraries/weasels/dna.ts - Optimized version
import { Gene } from './gene';
import { Point } from './point';
import { Line } from './line';

export class Dna {
  public genes: Gene[] = []; // Initialize to empty array

  // Cache for frequently used operations
  private _stopsCache: Point[] | null = null;
  private _pathsCache: Line[] | null = null;
  private _modified: boolean = true;

  constructor() {
    // Constructor is now empty as we initialized genes above
  }

  init = (nrGenes: number): void => {
    this.genes = [];
    // Clear caches
    this._stopsCache = null;
    this._pathsCache = null;
    this._modified = true;

    // Preallocate array for better performance
    this.genes = new Array(nrGenes);

    for (let i = 0; i < nrGenes; i++) {
      let g = new Gene();
      this.genes[i] = g;
      g.init();
    }

    // Connect genes in sequence initially
    for (let i = 1; i < nrGenes; i++) {
      this.genes[i].addToParent(this.genes[i - 1]);
    }
  };

  public getGene = (ix: number): Gene => this.genes[ix];

  // Add a new gene to this dna
  public addNewGene = (): Gene => {
    let newGene = new Gene();
    newGene.init();
    this.genes.push(newGene);
    // Invalidate caches
    this._modified = true;
    return newGene;
  };

  public deleteGene = (gene: Gene): void => {
    if (gene.parent) {
      this.moveChildren(gene, gene.parent);
      const index = this.genes.indexOf(gene);
      if (index >= 0) {
        this.genes.splice(index, 1);
      }
      // Invalidate caches
      this._modified = true;
    }
  }

  public moveChildren = (oldGene: Gene, newGene: Gene): void => {
    let children = this.getGeneChildPaths(oldGene);
    for (let c of children) {
      c.addToParent(newGene);
    }
    // Invalidate caches
    this._modified = true;
  }

  private getGeneChildPaths = (parentGene: Gene): Gene[] => {
    let children: Gene[] = [];
    // Loop through genes only once and collect all children
    for (let g of this.genes) {
      if (g.parent === parentGene) {
        children.push(g);
      }
    }
    return children;
  }

  // Move a gene to a new parent
  public moveGeneToNewParent = (geneToMove: Gene, newparent: Gene): void => {
    if (geneToMove.isRoot()) {
      // We need to find another gene to be the root, so elect one of the children
      // of the geneToMove.
      const children = this.getGeneChildPaths(geneToMove);
      if (children.length > 0) {
        // A gene who is his own parent is a root gene.
        children[0].parent = null; // Make the child the new root
        geneToMove.addToParent(newparent);
      }
    } else {
      geneToMove.addToParent(newparent);
    }
    // Invalidate caches
    this._modified = true;
  };

  public isLeaf = (aGene: Gene): boolean => {
    for (let g of this.genes) {
      if (g.parent === aGene) {
        return false;
      }
    }
    return true;
  }


  // Return an array of food stops.
  public stops = (): Point[] => {
    // Use cache if available and not modified
    if (!this._modified && this._stopsCache) {
      return this._stopsCache;
    }

    let corners: Point[] = [];
    for (let g of this.genes) {
      corners.push(g.stop);
    }

    // Update cache
    this._stopsCache = corners;
    return corners;
  };

  // Return an array of paths.
  public paths = (): Line[] => {
    // Use cache if available and not modified
    if (!this._modified && this._pathsCache) {
      return this._pathsCache;
    }

    let paths: Line[] = [];
    for (let g of this.genes) {
      if (!g.isRoot() && g.parent) {
        paths.push(new Line(g.parent.stop, g.stop));
      }
    }

    // Update cache and reset modified flag
    this._pathsCache = paths;
    this._modified = false;
    return paths;
  };

  // Copy the contents of a DNA into this one.
  public copyIn = (inDna: Dna): void => {
    const inGenes = inDna.genes;
    const geneCount = inGenes.length;

    // Preallocate genes array for better performance
    this.genes = new Array(geneCount);

    // Create all genes and copy positions first
    for (let i = 0; i < geneCount; i++) {
      let ng = new Gene();
      this.genes[i] = ng;
      const g = inGenes[i];
      // Reuse the Point object instead of creating a new one
      ng.stop.copyFrom(g.stop);
    }

    // The first gene is always the root
    this.genes[0].parent = null;

    // Set parent references for all other genes
    for (let i = 1; i < geneCount; i++) {
      if (inGenes[i].parent) {
        const parentIdx = inGenes.indexOf(inGenes[i].parent!);
        if (parentIdx >= 0) {
          this.genes[i].parent = this.genes[parentIdx];
        }
      }
    }

    // Invalidate caches
    this._stopsCache = null;
    this._pathsCache = null;
    this._modified = true;
  };

  // Return a random gene from this DNA.
  public randomGene = (): Gene => {
    if (this.genes.length === 0) {
      throw new Error("Cannot select a random gene from empty DNA");
    }
    const ix = Math.floor(Math.random() * this.genes.length);
    return this.genes[ix];
  };

  public isValidTree = (): boolean => {
    const gs = this.genes;
    if (gs.length < 2) {
      return false;
    }

    if (!gs[0].isRoot()) {
      return false;
    }

    let roots = 0;
    for (let g of this.genes) {
      if (g.isRoot()) {
        roots++;
      }
      if (roots > 1) {
        return false;
      }
      if (g === g.parent) {
        return false;
      }
    }

    // Check for cycles using an iterative approach (faster than recursive)
    for (let g of gs) {
      if (g.isRoot()) {
        continue;
      }

      const visited = new Set<Gene>();
      let current = g;

      while (current.parent) {
        if (visited.has(current)) {
          return false; // Cycle detected
        }
        visited.add(current);
        current = current.parent;
      }
    }

    return true;
  }

}