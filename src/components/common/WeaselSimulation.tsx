import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { SWeaselVm } from '../../libraries/weasels';

interface WeaselSimulationProps {
  mutationLevel?: number; // 1-5, defaults to 5
  withBadger?: boolean;   // Whether to include badger, defaults to true
  initialFoodSources?: number; // Initial number of food sources, defaults to 25
  height?: number; // Height of the canvas in pixels, defaults to 600
}

/**
 * A component that displays an interactive weasel genetic algorithm simulation.
 *
 * @param mutationLevel - How many different mutation types are allowed (1-5)
 * @param withBadger - Whether to include a predator in the simulation
 * @param initialFoodSources - Number of food sources to start with
 * @param height - Height of the simulation canvas in pixels
 */
const WeaselSimulation: React.FC<WeaselSimulationProps> = ({
                                                             mutationLevel = 5,
                                                             withBadger = false,
                                                             initialFoodSources = 25,
                                                             height = 600
                                                           }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationInitialized = useRef(false);
  const viewModelRef = useRef<SWeaselVm | null>(null);

  useEffect(() => {
    // Only initialize the simulation once
    if (containerRef.current && !simulationInitialized.current) {
      // Create the necessary HTML structure
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

      // Initialize the simulation
      viewModelRef.current = new SWeaselVm(containerRef.current, mutationLevel, withBadger);

      // Trigger the reset button to initialize the simulation
      const resetButton = containerRef.current.querySelector('.btnReset');
      if (resetButton) {
        (resetButton as HTMLButtonElement).click();
      }

      simulationInitialized.current = true;
    }

    // Cleanup function
    return () => {
      if (containerRef.current && simulationInitialized.current && viewModelRef.current) {
        // We need to handle cleanup if the component unmounts
        const stopButton = containerRef.current.querySelector('.btnStop');
        if (stopButton) {
          (stopButton as HTMLButtonElement).click();
        }

        // Clear any timers that might be active
        // Access private field with type assertion to make TypeScript happy
        const vm = viewModelRef.current as any;
        if (vm._cycleTimer) {
          window.clearInterval(vm._cycleTimer);
        }
      }
    };
  }, [mutationLevel, withBadger, initialFoodSources, height]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: 2,
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
  );
};

export default WeaselSimulation;