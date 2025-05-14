class Dna {
    public genes: Gene[];
    constructor() {
    }

    init = (nrGenes: number) => {
        this.genes = [];
        for ( let i = 0; i < nrGenes; i++) {
            let g = new Gene();
            this.genes.push(g);
            g.Init();
        }

        for (let i = 1; i < nrGenes; i++)
            this.genes[i].addToParent(this.genes[i - 1]);

        let lastGene = this.genes[this.genes.length- 1];
    };

    public getGene = (ix: number) => this.genes[ix];

    // Add a new gene to this dna
    public addNewGene = (): Gene => {
        let newGene = new Gene();
        newGene.Init();
        this.genes.push(newGene);
        return newGene; 
    };

    public deleteGene = (gene: Gene) => {
        this.moveChildren(gene, gene.parent);
        this.genes.splice(this.genes.indexOf(gene), 1);
    }

    public moveChildren = (oldGene: Gene, newGene: Gene) => {
        let children = this.getGeneChildPaths(oldGene);
        for (let c of children)
            c.addToParent(newGene);
    }
    
    private getGeneChildPaths = (parentGene: Gene): Gene[] => {
        let children: Gene[] = [];
        for (let g of this.genes)
            if (g.parent === parentGene)
                children.push(g);
         return children;
    }

    // Move a path from one gene to another.
    public moveGeneToNewParent = (geneToMove: Gene,  newparent: Gene) => {
        if (geneToMove.isRoot()) {
            // We need to find another gene to be the root, so elect one of the children
            //  of the geneToMove.
            let aChildPath = this.getGeneChildPaths(geneToMove)[0];
            // A gene who is his own parent is a root gene.
            aChildPath.addToParent(aChildPath);
        }
        else
            geneToMove.addToParent(newparent);
    };

    public isLeaf = (aGene: Gene): boolean => {
        for (let g of this.genes)
            if (g === aGene.parent)
                return false;
        return true;
    }

    public childCount = (aGene: Gene) => {
        let count = 0;
        for (let g of this.genes)
            if (g.parent === aGene)
                count++;
        return count;
    }

    // Return an array of food stops.
    public stops = (): Point[] => {
        let crnrs: Point[] = [];
        for (let g of this.genes)
            crnrs.push(g.stop);
        return crnrs;
    };

    // Return an array of paths.
    public paths = (): Line[] => {
        let pths: Line[] = [];
        for (let g of this.genes)
            if (!g.isRoot())
                pths.push(new Line(g.parent.stop, g.stop));
        return pths;
    };

    // Copy the contents of a DNA into this one.
    public copyIn = (inDna: Dna) => {
        this.genes = [];
        for (let g of inDna.genes) {
            let ng = new Gene();
            this.genes.push(ng);
            ng.stop = new Point(g.stop.x, g.stop.y);
        }
        this.genes[0].parent = null;
        for (let i = 1; i < this.genes.length; i++) {
            let parentix = inDna.genes.indexOf(inDna.genes[i].parent);
            this.genes[i].parent = this.genes[parentix];
        }
    };

    // Return a random gene from this DNA.
    public randomGene = (): Gene => {
        let ix = Math.floor(Math.random() * this.genes.length);
        return this.genes[ix];
    };

    public isValidTree = (): boolean => {
        let gs = this.genes;
        if (gs.length < 2)
            return false;

        if (!gs[0].isRoot())
            return false;

        let roots = 0;
        for (let g of this.genes) {
            if (g.isRoot())
                roots++;
            if (roots > 1)
                return false;
            if (g === g.parent)
                return false;
        }
            

        for (let g of this.genes) {
            if (g.isRoot())
                continue;
            
            let path: Gene[] = [];
            if (this.isGraph(g.parent, path))
                return false;
        }
        return true;
    }

    private isGraph = (gene: Gene, path: Gene[]): boolean => {
        let ix = this.genes.indexOf(gene);
        let pix = this.genes.indexOf(gene.parent);
        if (gene === this.genes[0])
            return false;
        if (path.indexOf(gene) !== -1)
            return true;
        path.push(gene);
        return (this.isGraph(gene.parent, path));
    }

    public  reportDna = (msg: string) => {
        console.log("");
        for (let g of this.genes) {
        console.log(msg + ": gix: %d, pix: %d", this.genes.indexOf(g), this.genes.indexOf(g.parent));
        }
    };
}