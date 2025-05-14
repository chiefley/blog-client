class SBadger {
    private _passState: number;
    private _yIncrement: number;
    public position: Point;
    
    constructor() {
        this.reset();
    };
    
    private reset = () => {
        this.position = new Point(0, Math.floor(Math.random() * 1000));
        this._yIncrement = Math.floor(Math.random() * 20) - 10;
    };
    
    public moveRandom = () => {
        let min = Math.min(this.position.x, this.position.y);
        let max = Math.max(this.position.x, this.position.y);
        
        if ((min < 0) || (max > 1000))
            this.reset();
            
        this.position.x += 5;
        this.position.y += this._yIncrement;
    };
}