class DWeaselWorld {
    private parentWeasel: DWeasel;
    private childWeasels: DWeasel[];
    
    constructor (private targetString: string, private startString: string) {
        this.parentWeasel = new DWeasel(startString);
        this.childWeasels = [];
    }
    
    public init = () => {
      this.childWeasels = [];
      for (let i = 0; i < 5000; i++)
        this.childWeasels[i] = new DWeasel(this.startString);
    };
    
    public bestDna = ():string =>  this.parentWeasel.readDna();
    
    public worldCycle = () => {
      let minFitness = this.unfitness(this.parentWeasel.readDna());
      let minFitnessIx = -1;
      for (let i = 0; i < this.childWeasels.length; i++) {
        this.childWeasels[i].mutate();
        let unfit = this.unfitness(this.childWeasels[i].readDna());
        if (unfit <= minFitness) {
          minFitness = unfit;
          minFitnessIx = i;
        }
      }
      
      if (minFitnessIx > -1) {
        this.parentWeasel = new DWeasel(this.childWeasels[minFitnessIx].readDna());
        for (let i = 0; i < this.childWeasels.length; i++)
          this.childWeasels[i] = new DWeasel(this.parentWeasel.readDna());
      }
    }
    
    private unfitness = (dna: string): number => {
        return this.getEditDistance(this.targetString, dna);
    };
    
/*
Copyright (c) 2011 Andrei Mackenzie

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Compute the edit distance between the two given strings
private getEditDistance = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let matrix: number[][] = [];

  // increment along the first column of each row
  for (let i = 0; i <= b.length; i++){
    matrix[i] = [i];
  }

  // increment each column in the first row
  for(let j = 0; j <= a.length; j++){
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++){
    for (let j = 1; j <= a.length; j++){
      if (b.charAt(i - 1) === a.charAt(j - 1)){
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j -1 ] + 1, // substitution
                                Math.min(matrix[i][j - 1] + 1, // insertion
                                         matrix[i - 1 ][j] + 1)); // deletion
      }
    }
  }

  let result = matrix[b.length][a.length];
  return result;
};
}