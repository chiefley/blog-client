// sbadger.ts - Fixed version with unused properties removed
import { Point } from './point';

export class SBadger {
  private _yIncrement: number = 0;
  public position: Point;

  constructor() {
    this.position = new Point(0, 0);
    this.reset();
  }

  private reset = (): void => {
    this.position = new Point(0, Math.floor(Math.random() * 1000));
    this._yIncrement = Math.floor(Math.random() * 20) - 10;
  };

  public moveRandom = (): void => {
    let min = Math.min(this.position.x, this.position.y);
    let max = Math.max(this.position.x, this.position.y);

    if ((min < 0) || (max > 1000)) {
      this.reset();
    }

    this.position.x += 5;
    this.position.y += this._yIncrement;
  };
}