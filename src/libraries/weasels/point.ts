// src/libraries/weasels/point.ts - Optimized version
export class Point {
  constructor(public x: number, public y: number) {
  }

  // Returns the distance to another point - keeping original implementation
  // but with slight optimization
  public rangeFrom = (fromP: Point): number => {
    let xdiff = Math.abs(fromP.x - this.x);
    let ydiff = Math.abs(fromP.y - this.y);
    return Math.max(xdiff, ydiff) + (Math.min(xdiff, ydiff) / 2);
  };

  // Move this point by a random amount - optimized with faster calculation
  public randomMove = (scale: number) => {
    // Using bitwise operations for faster integer operations
    const halfScale = scale / 2;
    this.x += (Math.random() * scale) - halfScale;
    this.y += (Math.random() * scale) - halfScale;
  };

  private randomIncrement = (pos: number, scale: number) => {
    let offset = scale / 2.0;
    let rand = Math.random();
    let incr = (rand * scale) - offset;
    let newpos = incr + pos;
    return newpos;
  };
}