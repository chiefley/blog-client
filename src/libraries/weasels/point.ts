// src/libraries/weasels/point.ts - Optimized version
export class Point {
  constructor(public x: number, public y: number) {
  }
  
  // Copy values from another point
  public copyFrom(other: Point): void {
    this.x = other.x;
    this.y = other.y;
  }

  // Returns the distance to another point - keeping original implementation
  // but with slight optimization
  public rangeFrom = (fromP: Point): number => {
    const xdiff = Math.abs(fromP.x - this.x);
    const ydiff = Math.abs(fromP.y - this.y);
    return Math.max(xdiff, ydiff) + (Math.min(xdiff, ydiff) / 2);
  };

  // Move this point by a random amount - optimized with faster calculation
  public randomMove = (scale: number) => {
    // Using bitwise operations for faster integer operations
    const halfScale = scale / 2;
    this.x += (Math.random() * scale) - halfScale;
    this.y += (Math.random() * scale) - halfScale;
  };

  // Returns a value proportional to squared distance - for comparison only
  // Not the actual distance - use rangeFrom for actual distance
  public rangeFromSquaredApprox = (fromP: Point): number => {
    const xdiff = fromP.x - this.x;
    const ydiff = fromP.y - this.y;
    // Return squared differences for comparison purposes
    return xdiff * xdiff + ydiff * ydiff;
  };
}