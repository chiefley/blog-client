
class SWeasel {
    private _dna: Dna;
    private _mutationType: number;
    constructor (private _mutationLevel: number
) {
    }

    public init = (stops: number) => {
        this._dna = new Dna();
        this._dna.init(stops);
    };

    public stops = (): Point[] => this._dna.stops();
    public paths = (): Line[] => this._dna.paths();
    
    public weaselIx: number;
    public isAlive = (): boolean => (this._dna !== undefined) && this._dna.isValidTree();

    public copyIn = (inWeasel: SWeasel) => {
        if (typeof this._dna === "undefined")
            this._dna = new Dna();
        this._dna.copyIn(inWeasel._dna);
    };

    public mutate = () => {
      //  this.randomMovePath();
        let nrMutations = Math.floor(Math.random() * 3);

        for (let i = 0; i < nrMutations; i++) {
            this._mutationType = Math.floor(Math.random() * this._mutationLevel);
            switch (this._mutationType) {
                case 0:
                    this.randomMoveStop();
                    break;
                case 1:
                    this.randomAddStop();
                    break;
                case 2:
                    this.randomDeleteStop();
                    break;
                case 3:
                    this.randomMovePath();
                    break;
                case 4:
                    this.randomInsertStop();
                    break;
            }
        }
    };

    private randomMovePath = () => {
        let geneToMove: Gene;
        let newParent: Gene;
        let genes = this.stops();

            do {
                geneToMove = this._dna.randomGene();
            } while (geneToMove.isRoot())

            do {
                newParent = this._dna.randomGene();
            } while (newParent === geneToMove);

            this._dna.moveGeneToNewParent(geneToMove, newParent);
            

        if (this._dna.getGene(0).parent !== null)
            throw Error("Root parent is not null.");
    };

    private randomMoveStop = () => {
        let geneToMove = this._dna.randomGene();
        geneToMove.stop.randomMove(50);
    };

    private randomAddStop = () => {
        let parentGene = this._dna.randomGene();
        let newGene = this._dna.addNewGene();
        newGene.addToParent(parentGene);
    };

    private randomDeleteStop = () => {
        let aGene: Gene 
        do {
            aGene = this._dna.randomGene();
        } while (aGene.isRoot());

        this._dna.deleteGene(aGene);
    };

    private randomInsertStop = () => {
        let aGene: Gene;
        let i = 0;
        do {
            aGene = this._dna.randomGene();
            i++;
        } while ((aGene.isRoot() || this._dna.isLeaf(aGene)) && (i < 40))

        if (i < 40) {
            let newGene = this._dna.addNewGene();
            let parentGene = aGene.parent;
            this._dna.moveChildren(aGene, newGene);
            if (this._dna.childCount(aGene) == 1999) {
                aGene.addToParent(newGene);
                newGene.addToParent(parentGene);
            }
            else {
                newGene.addToParent(aGene);
            }
        }
    };

    // private reportDna = () => {
    //     console.log("");
    //     for (let g of this._dna.genes) {
    //         let gix = this._dna.genes.indexOf(g);
    //         let gpix = this._dna.genes.indexOf(g.parent);

    //         console.log("gix: " + gix + ", gpix: " + gpix);
    //     }
    //}
};