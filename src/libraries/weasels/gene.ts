// gene.ts - Represents a gene in the genetic algorithm
import { Point } from './point';

export class Gene {
  // Reference to the parent gene in the tree
  public parent: Gene | null = null;

  // The x,y location of the food stop for this gene
  public stop: Point = new Point(0, 0);

  constructor() {
  }

  public Init = (): void => {
    this.parent = null;
    this.stop = new Point(0, 0);
    this.stop.x = Math.random() * 1000;
    this.stop.y = Math.random() * 1000;
    this.stop.randomMove(100);
  };

  // True if this gene is a root node in the tree.
  public isRoot = (): boolean => (this.parent === null);

  // Add a path to another gene.
  public addToParent = (parentGene: Gene): void => {
    this.parent = parentGene;
  };
}