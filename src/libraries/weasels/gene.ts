// gene.ts - Represents a gene in the genetic algorithm
import { Point } from './point';

export class Gene {
  // Reference to the parent gene in the tree
  private _parent: Gene | null = null;

  // The x,y location of the food stop for this gene
  private _stop: Point = new Point(0, 0);

  // Getters for accessing private properties
  public get parent(): Gene | null {
    return this._parent;
  }

  public set parent(value: Gene | null) {
    this._parent = value;
  }

  public get stop(): Point {
    return this._stop;
  }

  public set stop(value: Point) {
    this._stop = value;
  }

  constructor() {
  }

  public init(): void {
    this._parent = null;
    this._stop = new Point(0, 0);
    this._stop.x = Math.random() * 1000;
    this._stop.y = Math.random() * 1000;
    this._stop.randomMove(100);
  }

  // True if this gene is a root node in the tree.
  public isRoot(): boolean {
    return this._parent === null;
  }

  // Add a path to another gene.
  public addToParent(parentGene: Gene): void {
    this._parent = parentGene;
  }
}