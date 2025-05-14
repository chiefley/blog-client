// line.ts - Represents a line between two points
import { Point } from './point';

export class Line {
  constructor(public start: Point, public end: Point) {
  }

  // Return the length of this line.
  public length = (): number => {
    return this.start.rangeFrom(this.end);
  };

  public pointRangeFromLine = (point: Point): number => {
    let x = point.x;
    let y = point.y;

    let x1 = this.start.x;
    let y1 = this.start.y;

    let x2 = this.end.x;  // Fixed: was using start.x instead of end.x
    let y2 = this.end.y;  // Fixed: was using start.y instead of end.y

    var A = x - x1;
    var B = y - y1;
    var C = x2 - x1;
    var D = y2 - y1;

    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq != 0) //in case of 0 length line
      param = dot / len_sq;

    var xx: number;
    var yy: number;

    if (param < 0) {
      xx = x1;
      yy = y1;
    }
    else if (param > 1) {
      xx = x2;
      yy = y2;
    }
    else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    var dx = x - xx;
    var dy = y - yy;
    return Math.floor(Math.sqrt(dx * dx + dy * dy));
  };
}