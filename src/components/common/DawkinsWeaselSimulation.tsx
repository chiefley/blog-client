// src/components/common/DawkinsWeaselSimulation.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';

// Import the Dawkins weasel classes (we'll need to convert them to proper ES modules)
class DWeasel {
    private dna: string;
    
    constructor (dna: string) {
        this.dna = dna.slice(0);
    }
    
    public init = (dna: string) => {
        this.dna = dna.slice(0);
    }
    
    public mutate = () => {
        const nrMutations = Math.floor(Math.random() * 4);
        const mutationType = Math.floor(Math.random() * 3);
        for (let i = 0; i < nrMutations; i++) {
            const randomPos = this.randomPosition();
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
        const unfit = this.unfitness(this.childWeasels[i].readDna());
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
    
    // Compute the edit distance between the two given strings
    private getEditDistance = (a: string, b: string) => {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;

      const matrix: number[][] = [];

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

      return matrix[b.length][a.length];
    };
}

interface DawkinsWeaselSimulationProps {
  targetString?: string;
  maxGenerations?: number;
  height?: number;
  showControls?: boolean;
}

const DawkinsWeaselSimulation: React.FC<DawkinsWeaselSimulationProps> = ({
  targetString: initialTargetString = "Methinks it is like a weasel.",
  maxGenerations = 1000,
  height = 400,
  showControls = true
}) => {
  const worldRef = useRef<DWeaselWorld | null>(null);
  const cycleTimerRef = useRef<number>(0);
  
  const [targetString, setTargetString] = useState<string>(initialTargetString);
  const [currentString, setCurrentString] = useState<string>('');
  const [generations, setGenerations] = useState<number>(0);
  const [results, setResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [fitness, setFitness] = useState<number>(0);

  // Initialize the world
  const initializeWorld = () => {
    if (!targetString.trim()) return;
    
    const startString = DWeasel.randomString();
    worldRef.current = new DWeaselWorld(targetString, startString);
    worldRef.current.init();
    
    setCurrentString(startString);
    setGenerations(0);
    setResults([]);
    setIsInitialized(true);
    setFitness(calculateFitness(startString, targetString));
    
    // Add initial result
    setResults([`${startString} (0)`]);
  };

  // Calculate fitness as percentage match
  const calculateFitness = (current: string, target: string): number => {
    if (target.length === 0) return 100;
    const editDistance = getEditDistance(current, target);
    const maxDistance = Math.max(current.length, target.length);
    return Math.max(0, Math.round(((maxDistance - editDistance) / maxDistance) * 100));
  };

  // Simple edit distance calculation for fitness display
  const getEditDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1   // deletion
            )
          );
        }
      }
    }

    return matrix[b.length][a.length];
  };

  // World cycle
  const worldCycle = () => {
    if (!worldRef.current) return;

    const newGenerations = generations + 1;
    setGenerations(newGenerations);
    
    worldRef.current.worldCycle();
    const bestDna = worldRef.current.bestDna();
    setCurrentString(bestDna);
    
    const newFitness = calculateFitness(bestDna, targetString);
    setFitness(newFitness);
    
    // Add result to the beginning of the array
    setResults(prevResults => [`${bestDna} (${newGenerations})`, ...prevResults.slice(0, 19)]);
    
    // Check if we've reached the target or max generations
    if (bestDna === targetString || newGenerations >= maxGenerations) {
      stopSimulation();
    }
  };

  // Start simulation
  const startSimulation = () => {
    if (!isInitialized) return;
    
    setIsRunning(true);
    cycleTimerRef.current = window.setInterval(worldCycle, 200); // Faster than the original 500ms
  };

  // Stop simulation
  const stopSimulation = () => {
    if (cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current);
      cycleTimerRef.current = 0;
    }
    setIsRunning(false);
  };

  // Reset simulation
  const resetSimulation = () => {
    stopSimulation();
    initializeWorld();
  };

  // Handle target string change
  const handleTargetStringChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTargetString(event.target.value);
    setIsInitialized(false);
  };

  // Initialize on mount
  useEffect(() => {
    initializeWorld();
    
    // Cleanup on unmount
    return () => {
      stopSimulation();
    };
  }, []);

  // Auto-initialize when target string changes
  useEffect(() => {
    if (targetString.trim()) {
      initializeWorld();
    }
  }, [targetString]);

  return (
    <Paper sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Dawkins' Weasel Algorithm
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        This simulation demonstrates Richard Dawkins' famous "weasel" program from 
        "The Blind Watchmaker", showing how random mutations combined with selection 
        can evolve toward a target string.
      </Typography>

      {showControls && (
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Target String"
            value={targetString}
            onChange={handleTargetStringChange}
            disabled={isRunning}
            variant="outlined"
            size="small"
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={resetSimulation}
              disabled={isRunning}
              size="small"
            >
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={startSimulation}
              disabled={isRunning || !isInitialized}
              size="small"
            >
              Run
            </Button>
            <Button
              variant="outlined"
              onClick={stopSimulation}
              disabled={!isRunning}
              size="small"
            >
              Stop
            </Button>
          </Box>
        </Box>
      )}

      {/* Status Display */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2, 
        mb: 3,
        p: 2,
        bgcolor: 'background.default',
        borderRadius: 1
      }}>
        <Box>
          <Typography variant="caption" color="text.secondary">Generation</Typography>
          <Typography variant="h6" color="primary.main">{generations}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Fitness</Typography>
          <Typography variant="h6" color="primary.main">{fitness}%</Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="caption" color="text.secondary">Current Best</Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              fontFamily: 'monospace',
              bgcolor: 'white',
              p: 1,
              borderRadius: 0.5,
              border: '1px solid',
              borderColor: 'divider',
              wordBreak: 'break-all'
            }}
          >
            {currentString || 'Not initialized'}
          </Typography>
        </Box>
      </Box>

      {/* Target vs Current Comparison */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Target vs Current</Typography>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1,
          fontFamily: 'monospace',
          fontSize: '0.9rem'
        }}>
          <Box sx={{ p: 1, bgcolor: 'success.light', borderRadius: 0.5, color: 'success.contrastText' }}>
            <strong>Target:</strong> {targetString}
          </Box>
          <Box sx={{ p: 1, bgcolor: 'info.light', borderRadius: 0.5, color: 'info.contrastText' }}>
            <strong>Current:</strong> {currentString}
          </Box>
          {/* Character-by-character comparison */}
          <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 0.5, fontSize: '0.8rem' }}>
            <strong>Match:</strong> {
              targetString.split('').map((char, index) => (
                <span 
                  key={index} 
                  style={{ 
                    backgroundColor: currentString[index] === char ? '#c8e6c9' : '#ffcdd2',
                    padding: '1px 2px',
                    margin: '0 1px'
                  }}
                >
                  {currentString[index] || '_'}
                </span>
              ))
            }
          </Box>
        </Box>
      </Box>

      {/* Results History */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>Evolution History</Typography>
        <Box sx={{ 
          height: height - 200,
          overflow: 'auto',
          bgcolor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1
        }}>
          {results.map((result, index) => (
            <Typography 
              key={index} 
              variant="body2" 
              sx={{ 
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                mb: 0.5,
                opacity: index === 0 ? 1 : Math.max(0.3, 1 - (index * 0.05))
              }}
            >
              {result}
            </Typography>
          ))}
          {results.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Results will appear here when the simulation runs...
            </Typography>
          )}
        </Box>
      </Box>

      {/* Success message */}
      {currentString === targetString && (
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          bgcolor: 'success.light', 
          borderRadius: 1,
          textAlign: 'center'
        }}>
          <Typography variant="h6" color="success.contrastText">
            🎉 Target Reached in {generations} Generations! 🎉
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DawkinsWeaselSimulation;
