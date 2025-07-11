import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Slider, 
  Typography, 
  FormControlLabel, 
  Switch, 
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import { WeaselSimulationOptimizer } from '../../libraries/weasels/weaselOptimizer';
import SpeedIcon from '@mui/icons-material/Speed';
import PetsIcon from '@mui/icons-material/Pets';
import SettingsIcon from '@mui/icons-material/Settings';

interface OptimizedWeaselSimulationProps {
  mutationLevel?: number; // 1-5, defaults to 5
  withBadger?: boolean;   // Whether to include badger, defaults to true
  initialFoodSources?: number; // Initial number of food sources, defaults to 25
  height?: number; // Height of the canvas in pixels, defaults to 600
  showControls?: boolean; // Whether to show optimization controls
}

/**
 * An optimized component that displays the weasel genetic algorithm simulation.
 */
const OptimizedWeaselSimulation: React.FC<OptimizedWeaselSimulationProps> = ({
  mutationLevel = 5,
  withBadger: initialWithBadger = false,
  initialFoodSources = 25,
  height = 600,
  showControls = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const optimizerRef = useRef<WeaselSimulationOptimizer | null>(null);
  const [speed, setSpeed] = useState<number>(1.5); // Default to 1.5x speed
  const [withBadger, setWithBadger] = useState<boolean>(initialWithBadger);
  const [showAdvancedControls, setShowAdvancedControls] = useState<boolean>(false);
  const theme = useTheme();

  // Track if the simulation is initialized
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize the simulation once
  useEffect(() => {
    if (containerRef.current) {
      // Create the necessary HTML structure first
      const htmlContent = `
        <div class="stats">
          <div>Generations: <span class="lblGenerations">0</span></div>
          <div>Calories Spent: <span class="lblSpentCalories">0</span></div>
          <div>Calories Acquired: <span class="lblAcquiredCalories">0</span></div>
          <div>Net Calories: <span class="lblNetCalories">0</span></div>
        </div>
        <canvas class="field" width="1000" height="${height}"></canvas>
        <div class="controls">
          <label>Food Sources: <input type="number" class="txtNumSources" value="${initialFoodSources}" min="5" max="100" /></label>
          <button class="btnReset">Reset</button>
          <button class="btnRun">Run</button>
          <button class="btnStop">Stop</button>
          <button class="btnSingleStep">Step</button>
          <button class="btnEarthquake">Earthquake</button>
        </div>
      `;
      containerRef.current.innerHTML = htmlContent;

      // Initialize the simulation with our optimizer
      optimizerRef.current = new WeaselSimulationOptimizer(
        containerRef.current,
        mutationLevel,
        withBadger,
        {
          speedMultiplier: speed,
          showFps: false,
          isDarkMode: theme.palette.mode === 'dark'
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
  }, [mutationLevel, initialFoodSources, height]); // Note: theme is handled separately in another effect

  // Update speed when it changes
  useEffect(() => {
    if (optimizerRef.current) {
      optimizerRef.current.setSpeedMultiplier(speed);
    }
  }, [speed]);

  // Update theme when it changes
  useEffect(() => {
    if (optimizerRef.current) {
      optimizerRef.current.setDarkMode(theme.palette.mode === 'dark');
    }
  }, [theme.palette.mode]);

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
          showFps: false,
          isDarkMode: theme.palette.mode === 'dark'
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

  return (
    <Box sx={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          padding: 1.5,
          position: 'relative',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          '& .stats': {
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: { xs: 0.5, sm: 1 },
            maxWidth: '100%',
            mb: 1.5,
            '& > div': {
              px: { xs: 0.75, sm: 1 },
              py: { xs: 0.25, sm: 0.4 },
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 3,
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              fontWeight: 500,
              whiteSpace: 'nowrap',
              minWidth: 'fit-content',
              textAlign: 'center',
              '& span': {
                fontWeight: 'bold',
                color: 'inherit'
              }
            }
          },
          '& canvas.field': {
            width: '100%',
            height: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1
          },
          '& .controls': {
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            mt: 1,
            '& button': {
              px: 1.5,
              py: 0.5,
              borderRadius: 0.5,
              bgcolor: 'primary.main',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 500,
              '&:hover': {
                bgcolor: 'primary.dark'
              },
              '&:disabled': {
                bgcolor: 'grey.400',
                cursor: 'not-allowed'
              }
            },
            '& input': {
              p: 0.5,
              borderRadius: 0.5,
              border: '1px solid',
              borderColor: 'divider',
              mx: 0.5,
              width: 50,
              fontSize: '0.75rem'
            },
            '& label': {
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }
          }
        }}
      />

      {/* Compact controls row */}
      {showControls && (
        <Box sx={{
          mt: 1,
          p: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2,
          justifyContent: 'space-between'
        }}>
          {/* Speed control - compact */}
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
            <SpeedIcon sx={{ mr: 0.5, fontSize: '1rem', color: 'primary.main' }} />
            <Typography variant="caption" sx={{ mr: 1, minWidth: 45, fontSize: '0.75rem' }}>
              {speed}x
            </Typography>
            <Slider
              value={speed}
              onChange={handleSpeedChange}
              step={speed < 10 ? 0.5 : 5}
              min={0.5}
              max={50}
              marks={[
                { value: 1, label: '1x' },
                { value: 5, label: '5x' },
                { value: 10, label: '10x' },
                { value: 25, label: '25x' },
                { value: 50, label: 'Max' }
              ]}
              size="small"
              sx={{ flexGrow: 1, mx: 1 }}
            />
          </Box>

          {/* Badger toggle - compact */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PetsIcon sx={{ 
              mr: 0.5, 
              fontSize: '1rem',
              color: withBadger ? 'error.main' : 'text.disabled' 
            }} />
            <FormControlLabel
              control={
                <Switch 
                  checked={withBadger} 
                  onChange={handleBadgerChange}
                  size="small"
                />
              }
              label={
                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                  Predator
                </Typography>
              }
              sx={{ mr: 0 }}
            />
          </Box>

          {/* Settings toggle for future expansion */}
          <Tooltip title="Advanced Settings (Coming Soon)">
            <span>
              <IconButton 
                size="small"
                onClick={() => { setShowAdvancedControls(!showAdvancedControls); }}
                disabled
                sx={{ opacity: 0.5 }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      )}

      {/* Future: Advanced controls panel that can be toggled */}
      {showAdvancedControls && (
        <Box sx={{
          mt: 1,
          p: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.default'
        }}>
          <Typography variant="caption" color="text.secondary">
            Advanced controls will be available here in future versions
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default OptimizedWeaselSimulation;