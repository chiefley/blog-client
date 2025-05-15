import React, { useEffect, useRef, useState } from 'react';
import { Box, Slider, Typography, FormControlLabel, Switch, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { WeaselSimulationOptimizer } from '../../libraries/weasels/weaselOptimizer';
import SpeedIcon from '@mui/icons-material/Speed';
import PetsIcon from '@mui/icons-material/Pets';

interface OptimizedWeaselSimulationProps {
  mutationLevel?: number; // 1-5, defaults to 5
  withBadger?: boolean;   // Whether to include badger, defaults to true
  initialFoodSources?: number; // Initial number of food sources, defaults to 15
  height?: number; // Height of the canvas in pixels, defaults to 600
  showControls?: boolean; // Whether to show optimization controls
}

/**
 * An optimized component that displays the weasel genetic algorithm simulation.
 */
const OptimizedWeaselSimulation: React.FC<OptimizedWeaselSimulationProps> = ({
                                                                               mutationLevel = 5,
                                                                               withBadger: initialWithBadger = false,
                                                                               initialFoodSources = 15,
                                                                               height = 600,
                                                                               showControls = true
                                                                             }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const optimizerRef = useRef<WeaselSimulationOptimizer | null>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [showFps, setShowFps] = useState<boolean>(false);
  const [optimizationLevel, setOptimizationLevel] = useState<string>("medium");
  const [withBadger, setWithBadger] = useState<boolean>(initialWithBadger);

  // Track if the simulation is initialized
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize the simulation once
  useEffect(() => {
    if (containerRef.current) {
      // Create the necessary HTML structure first
      containerRef.current.innerHTML = `
        <canvas class="field" width="1000" height="${height}"></canvas>
        <div class="controls">
          <label>Food Sources: <input type="number" class="txtNumSources" value="${initialFoodSources}" min="5" max="100" /></label>
          <button class="btnReset">Reset</button>
          <button class="btnRun">Run</button>
          <button class="btnStop">Stop</button>
          <button class="btnSingleStep">Step</button>
          <button class="btnEarthquake">Earthquake</button>
        </div>
        <div class="stats">
          <div>Generations: <span class="lblGenerations">0</span></div>
          <div>Calories Spent: <span class="lblSpentCalories">0</span></div>
          <div>Calories Acquired: <span class="lblAcquiredCalories">0</span></div>
          <div>Net Calories: <span class="lblNetCalories">0</span></div>
        </div>
      `;

      // Initialize the simulation with our optimizer
      optimizerRef.current = new WeaselSimulationOptimizer(
        containerRef.current,
        mutationLevel,
        withBadger,
        {
          speedMultiplier: speed,
          showFps: showFps
        }
      );

      // Click the reset button to initialize the simulation
      const resetButton = containerRef.current.querySelector('.btnReset');
      if (resetButton) {
        (resetButton as HTMLButtonElement).click();
        setIsInitialized(true);
      }
    }

    // Clean up resources when component unmounts
    return () => {
      if (optimizerRef.current) {
        optimizerRef.current.dispose();
      }
    };
  }, [mutationLevel, initialFoodSources, height]);

  // Update speed when it changes
  useEffect(() => {
    if (optimizerRef.current) {
      optimizerRef.current.setSpeedMultiplier(speed);
    }
  }, [speed]);

  // Update FPS display when it changes
  useEffect(() => {
    if (optimizerRef.current) {
      optimizerRef.current.setShowFps(showFps);
    }
  }, [showFps]);

  // Apply optimization level presets
  useEffect(() => {
    if (!optimizerRef.current) return;

    switch (optimizationLevel) {
      case "low":
        setSpeed(1);
        setShowFps(false);
        break;
      case "medium":
        setSpeed(1.5);
        setShowFps(true);
        break;
      case "high":
        setSpeed(2.5);
        setShowFps(true);
        break;
      case "ultra":
        setSpeed(4);
        setShowFps(true);
        break;
    }
  }, [optimizationLevel]);

  // Handle badger toggle and reinitialize the simulation
  const handleBadgerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Stop any running simulation first
    const stopButton = containerRef.current?.querySelector('.btnStop');
    if (stopButton) {
      (stopButton as HTMLButtonElement).click();
    }

    setWithBadger(event.target.checked);

    // We need to reinitialize the optimizer with the new badger setting
    if (containerRef.current && isInitialized) {
      // Clean up existing optimizer
      if (optimizerRef.current) {
        optimizerRef.current.dispose();
      }

      // Create a new optimizer with updated badger setting
      optimizerRef.current = new WeaselSimulationOptimizer(
        containerRef.current,
        mutationLevel,
        event.target.checked,
        {
          speedMultiplier: speed,
          showFps: showFps
        }
      );

      // Reset to initialize the simulation
      const resetButton = containerRef.current.querySelector('.btnReset');
      if (resetButton) {
        (resetButton as HTMLButtonElement).click();
      }
    }
  };

  const handleSpeedChange = (_event: Event, newValue: number | number[]) => {
    setSpeed(newValue as number);
  };

  const handleFpsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowFps(event.target.checked);
  };

  const handleOptimizationChange = (event: SelectChangeEvent) => {
    setOptimizationLevel(event.target.value);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      {showControls && (
        <Box sx={{
          mb: 2,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SpeedIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Performance Settings
            </Typography>
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="optimization-level-label">Optimization Level</InputLabel>
            <Select
              labelId="optimization-level-label"
              id="optimization-level"
              value={optimizationLevel}
              label="Optimization Level"
              onChange={handleOptimizationChange}
              size="small"
            >
              <MenuItem value="low">Low (Best Quality)</MenuItem>
              <MenuItem value="medium">Medium (Balanced)</MenuItem>
              <MenuItem value="high">High (Fast)</MenuItem>
              <MenuItem value="ultra">Ultra (Fastest)</MenuItem>
            </Select>
          </FormControl>

          <Typography id="speed-slider" gutterBottom>
            Simulation Speed: {speed}x
          </Typography>
          <Slider
            value={speed}
            onChange={handleSpeedChange}
            aria-labelledby="speed-slider"
            step={0.5}
            marks
            min={0.5}
            max={5}
            valueLabelDisplay="auto"
          />

          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
            flexWrap: 'wrap'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PetsIcon sx={{ mr: 1, color: withBadger ? 'error.main' : 'text.disabled' }} />
              <FormControlLabel
                control={<Switch checked={withBadger} onChange={handleBadgerChange} />}
                label="Include Badger (Predator)"
              />
            </Box>

            <FormControlLabel
              control={<Switch checked={showFps} onChange={handleFpsChange} />}
              label="Show FPS"
            />
          </Box>
        </Box>
      )}

      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          padding: 2,
          position: 'relative',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          '& canvas.field': {
            width: '100%',
            height: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.default'
          },
          '& .controls': {
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            my: 2,
            '& button': {
              px: 2,
              py: 1,
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              mx: 0.5,
              '&:hover': {
                bgcolor: 'primary.dark'
              },
              '&:disabled': {
                bgcolor: 'grey.400',
                cursor: 'not-allowed'
              }
            },
            '& input': {
              p: 1,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              mx: 1,
              width: 60
            }
          },
          '& .stats': {
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 2,
            maxWidth: 600,
            '& > div': {
              px: 1,
              py: 0.5,
              bgcolor: 'background.default',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              '& span': {
                fontWeight: 'bold',
                color: 'primary.main'
              }
            }
          }
        }}
      />
    </Box>
  );
};

export default OptimizedWeaselSimulation;