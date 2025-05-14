// dna.ts - Represents a collection of genes that form a DNA
import { Gene } from './gene';
import { Point } from './point';
import { Line } from './line';

export class Dna {
  public genes: Gene[] = []; // Initialize to empty array

  constructor() {
    // Constructor is now empty as we initialized genes above
  }

  init = (nrGenes: number): void => {
    this.genes = [];
    for (let i = 0; i < nrGenes; i++) {
      let g = new Gene();
      this.genes.push(g);
      g.Init();
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
    newGene.Init();
    this.genes.push(newGene);
    return newGene;
  };

  public deleteGene = (gene: Gene): void => {
    if (gene.parent) {
      this.moveChildren(gene, gene.parent);
      const index = this.genes.indexOf(gene);
      if (index >= 0) {
        this.genes.splice(index, 1);
      }
    }
  }

  public moveChildren = (oldGene: Gene, newGene: Gene): void => {
    let children = this.getGeneChildPaths(oldGene);
    for (let c of children) {
      c.addToParent(newGene);
    }
  }

  private getGeneChildPaths = (parentGene: Gene): Gene[] => {
    let children: Gene[] = [];
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
  };

  public isLeaf = (aGene: Gene): boolean => {
    for (let g of this.genes) {
      if (g.parent === aGene) {
        return false;
      }
    }
    return true;
  }

  public childCount = (aGene: Gene): number => {
    let count = 0;
    for (let g of this.genes) {
      if (g.parent === aGene) {
        count++;
      }
    }
    return count;
  }

  // Return an array of food stops.
  public stops = (): Point[] => {
    let corners: Point[] = [];
    for (let g of this.genes) {
      corners.push(g.stop);
    }
    return corners;
  };

  // Return an array of paths.
  public paths = (): Line[] => {
    let paths: Line[] = [];
    for (let g of this.genes) {
      if (!g.isRoot() && g.parent) {
        paths.push(new Line(g.parent.stop, g.stop));
      }
    }
    return paths;
  };

  // Copy the contents of a DNA into this one.
  public copyIn = (inDna: Dna): void => {
    this.genes = [];
    for (let g of inDna.genes) {
      let ng = new Gene();
      this.genes.push(ng);
      ng.stop = new Point(g.stop.x, g.stop.y);
    }

    // The first gene is always the root
    this.genes[0].parent = null;

    // Set parent references for all other genes
    for (let i = 1; i < this.genes.length; i++) {
      if (inDna.genes[i].parent) {
        const parentIdx = inDna.genes.indexOf(inDna.genes[i].parent!);
        if (parentIdx >= 0) {
          this.genes[i].parent = this.genes[parentIdx];
        }
      }
    }
  };

  // Return a random gene from this DNA.
  public randomGene = (): Gene => {
    if (this.genes.length === 0) {
      throw new Error("Cannot select a random gene from empty DNA");
    }
    let ix = Math.floor(Math.random() * this.genes.length);
    return this.genes[ix];
  };

  public isValidTree = (): boolean => {
    let gs = this.genes;
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

    // Check for cycles in the graph
    for (let g of this.genes) {
      if (g.isRoot()) {
        continue;
      }

      let path: Gene[] = [];
      if (this.hasCycle(g, path)) {
        return false;
      }
    }
    return true;
  }

  private hasCycle = (gene: Gene, path: Gene[]): boolean => {
    if (gene.isRoot()) {
      return false;
    }

    if (path.includes(gene)) {
      return true; // Cycle detected
    }

    path.push(gene);

    if (!gene.parent) {
      return false;
    }

    return this.hasCycle(gene.parent, path);
  }

  public reportDna = (msg: string): void => {
    console.log("");
    for (let g of this.genes) {
      const parentIndex = g.parent ? this.genes.indexOf(g.parent) : -1;
      console.log(`${msg}: gix: ${this.genes.indexOf(g)}, pix: ${parentIndex}`);
    }
  };
}