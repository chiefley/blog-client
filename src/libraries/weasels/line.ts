// src/libraries/weasels/line.ts - Optimized version
import { Point } from './point';

export class Line {
  // Precalculate these values
  private _dx: number;
  private _dy: number;
  private _cachedLength: number | null = null;

  constructor(public start: Point, public end: Point) {
    // Calculate dx and dy once during construction
    this._dx = this.end.x - this.start.x;
    this._dy = this.end.y - this.start.y;
  }
  
  // Update endpoints without creating new Line
  public update(start: Point, end: Point): void {
    this.start = start;
    this.end = end;
    this._dx = this.end.x - this.start.x;
    this._dy = this.end.y - this.start.y;
    this._cachedLength = null; // Invalidate cache
  }

  // Return the length of this line - with caching
  public length = (): number => {
    // Use cached value if available
    if (this._cachedLength === null) {
      this._cachedLength = this.start.rangeFrom(this.end);
    }
    return this._cachedLength;
  };

  // Calculate distance from point to line - optimized implementation
  public pointRangeFromLine = (point: Point): number => {
    // Early exit for zero-length line
    if (this._dx === 0 && this._dy === 0) {
      return this.start.rangeFrom(point);
    }

    const x = point.x;
    const y = point.y;
    const x1 = this.start.x;
    const y1 = this.start.y;

    // Calculate squared length of the line segment
    const lengthSq = this._dx * this._dx + this._dy * this._dy;

    // Calculate projection coefficient
    const t = Math.max(0, Math.min(1,
      ((x - x1) * this._dx + (y - y1) * this._dy) / lengthSq
    ));

    // Calculate closest point on the line segment
    const closestX = x1 + t * this._dx;
    const closestY = y1 + t * this._dy;

    // Calculate distance using the same approximation as Point.rangeFrom
    const xdiff = Math.abs(x - closestX);
    const ydiff = Math.abs(y - closestY);

    return Math.floor(Math.max(xdiff, ydiff) + (Math.min(xdiff, ydiff) / 2));
  };
}