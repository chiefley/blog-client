class Gene {
    // The index of this gene.
    // Then index of a parent node in the tree for this gene (or -1 if none).
    parent: Gene;
    // The x,y location of the food stop for this gene.
    stop: Point;
    
    constructor() {
    }

    public Init = () => {
        this.parent = null;
        this.stop = new Point(0, 0);
        this.stop.x = Math.random() * 1000;
        this.stop.y = Math.random() * 1000;
        this.stop.randomMove(100);
    };

    // True if this gene is a root node in the tree.
    public isRoot = (): boolean => (this.parent === null);

    // Add a path to another gene.
    public addToParent = (parentGene: Gene) => {
        this.parent = parentGene;
    };
}