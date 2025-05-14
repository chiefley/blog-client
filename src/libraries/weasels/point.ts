class Point {
    constructor(public x: number, public y: number) {
    }
    
    // Returns the distance to another point.
    public rangeFrom = (fromP: Point): number => {
        let xdiff = Math.abs(fromP.x - this.x);
        let ydiff = Math.abs(fromP.y - this.y);
       return Math.max(xdiff, ydiff) + (Math.min(xdiff, ydiff) / 2);
    };
    
    // Move this point by a random amount.
    public randomMove = (scale: number) => {
        this.x = this.randomIncrement(this.x, scale);
        this.y = this.randomIncrement(this.y, scale);
    };
    
    private randomIncrement = (pos: number, scale: number) => {
        let offset = scale / 2.0;
        let rand = Math.random();
        let incr = (rand * scale) - offset;
        let newpos = incr + pos;
        return newpos;
    };
}