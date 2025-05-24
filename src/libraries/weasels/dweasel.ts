class DWeasel {
    private dna: string;
    
    constructor (dna: string) {
        this.dna = dna.slice(0);
    }
    
    public init = (dna: string) => {
        this.dna = dna.slice(0);
    }
    
    public mutate = () => {
        let nrMutations = Math.floor(Math.random() * 4);
        let mutationType = Math.floor(Math.random() * 3);
        for (let i = 0; i < nrMutations; i++) {
            let randomPos = this.randomPosition();
            switch (mutationType) {
                case 0: this.addChar(randomPos); break;
                case 1: this.deleteChar(randomPos); break;
                case 2: this.replaceChar(randomPos); break;
            }
        }
    };
    
    public readDna = (): string => this.dna.slice(0);
    
    public static randomString = (): string => {
        return [ DWeasel.randomChar(), DWeasel.randomChar(), DWeasel.randomChar() ].join("");
    }
    
    private addChar = (randomPos: number) => {
        this.dna = (randomPos < this.dna.length)
            ? [this.dna.slice(0, randomPos), DWeasel.randomChar(), this.dna.slice(randomPos)].join('')
            : this.dna.concat(DWeasel.randomChar());
    };
    
    private deleteChar = (randomPos: number) => {
        this.dna = (randomPos < this.dna.length)
            ? this.dna.slice(0, randomPos) + this.dna.slice(randomPos + 1)
            : this.dna.slice(0, randomPos - 1);
    };
    
    private replaceChar = (randomPos: number) => {
        if (randomPos === this.dna.length)
            return;
        this.deleteChar(randomPos);
        this.addChar(randomPos);
    };
    
    private randomPosition = (): number => {
        return Math.floor(Math.random() * (this.dna.length + 1));
    };
    
    private static randomChar = (): string => {
        return String.fromCharCode(Math.floor(Math.random() * 94) + 32);
    };
    
}