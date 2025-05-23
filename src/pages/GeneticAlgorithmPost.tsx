import React, { useState } from 'react';
import { Container, Typography, Box, Divider, Paper, Alert, FormControlLabel, Switch } from '@mui/material';
import OptimizedWeaselSimulation from '../components/common/OptimizedWeaselSimulation';
import PetsIcon from '@mui/icons-material/Pets';

const GeneticAlgorithmPost: React.FC = () => {
  const [withBadger, setWithBadger] = useState<boolean>(false);

  // Handler for the main badger toggle
  const handleBadgerToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWithBadger(event.target.checked);
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4, my: 4, borderRadius: 2 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Understanding Genetic Algorithms with Weasels
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          A visual exploration of evolutionary algorithms through hungry weasels
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Typography variant="body1" paragraph>
          Genetic algorithms are fascinating computational methods inspired by the process of natural selection.
          They help us solve complex optimization problems by mimicking how evolution works in nature.
          In this interactive demonstration, you'll witness "weasels" evolving their food-gathering strategies
          over multiple generations.
        </Typography>

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          my: 3,
          p: 2,
          bgcolor: withBadger ? 'error.light' : 'success.light',
          borderRadius: 2,
          transition: 'background-color 0.3s ease'
        }}>
          <PetsIcon sx={{ mr: 2, color: withBadger ? 'error.dark' : 'success.dark' }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium" color={withBadger ? 'error.dark' : 'success.dark'}>
              {withBadger ? 'Predator Mode: ON' : 'Safe Environment Mode'}
            </Typography>
            <Typography variant="body2" color={withBadger ? 'error.dark' : 'success.dark'}>
              {withBadger
                ? 'The weasels must now balance food gathering with avoiding the badger predator!'
                : 'The weasels can focus solely on efficient food gathering with no predators.'}
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={withBadger}
                onChange={handleBadgerToggle}
                color={withBadger ? 'error' : 'success'}
              />
            }
            label={withBadger ? "Disable Predator" : "Enable Predator"}
          />
        </Box>

        <Alert severity="info" sx={{ my: 3 }}>
          Press the <strong>Run</strong> button to start the simulation, and watch as the weasels evolve more efficient
          paths to gather food. Use <strong>Earthquake</strong> to randomly move food sources and see how the weasels adapt!
        </Alert>

        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
          Interactive Demonstration
        </Typography>

        {/* Using the optimized simulation component */}
        <OptimizedWeaselSimulation
          mutationLevel={5}
          withBadger={withBadger}
          initialFoodSources={25}
          height={500}
          showControls={true}
        />

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            How It Works
          </Typography>

          <Typography variant="body1" paragraph>
            Each weasel has DNA represented as a tree structure of genes. These genes determine
            the stops the weasel makes as it searches for food. Over generations, mutation and
            selection help the weasels find more efficient paths.
          </Typography>

          <Typography variant="body1" paragraph>
            The simulation uses five key aspects of genetic algorithms:
          </Typography>

          <Box component="ol" sx={{ pl: 4 }}>
            <li>
              <Typography variant="body1" paragraph>
                <strong>DNA Structure</strong>: Each weasel's DNA is a tree of genes. Each gene represents
                a "stop" where the weasel can potentially find food. The connections between genes form
                the path the weasel travels.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Fitness Function</strong>: Weasels are evaluated based on their net calories -
                calories acquired from food minus calories spent walking. If the badger is enabled, there's
                an additional penalty for coming too close to the predator.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Mutation</strong>: Each generation, weasels undergo random mutations:
              </Typography>
              <Box component="ul" sx={{ pl: 4 }}>
                <li>Move a stop to a new location</li>
                <li>Add a new stop</li>
                <li>Delete a stop</li>
                <li>Move a path to connect different stops</li>
                <li>Insert a stop between existing stops</li>
              </Box>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Selection</strong>: The fittest weasel from each generation (the one with the highest
                net calories) becomes the parent for the next generation.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Adaptation</strong>: Over time, weasels evolve more efficient strategies. When you
                trigger an "earthquake" to move food sources, you can observe how the algorithm adapts to
                the changing environment.
              </Typography>
            </li>
          </Box>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Controls Explained
          </Typography>

          <Box component="ul" sx={{ pl: 4 }}>
            <li>
              <Typography variant="body1">
                <strong>Reset</strong>: Start the simulation from scratch with new food sources
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Run</strong>: Run the simulation continuously
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Stop</strong>: Pause the running simulation
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Step</strong>: Run a single generation
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Earthquake</strong>: Randomly move food sources to test adaptation
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Predator Toggle</strong>: Turn the badger (predator) on/off to see how it affects the weasel's evolution
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Optimization Level</strong>: Choose between quality and speed
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Simulation Speed</strong>: Adjust how fast the simulation runs
              </Typography>
            </li>
          </Box>

          <Typography variant="body1" sx={{ mt: 2 }}>
            The colored elements in the simulation represent:
          </Typography>

          <Box component="ul" sx={{ pl: 4 }}>
            <li>
              <Typography variant="body1">
                <strong>Green circles</strong>: Food sources
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Black dots</strong>: Weasel stops
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Black lines</strong>: Paths between stops
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Red circle</strong>: Badger (predator) - {withBadger ? 'currently active' : 'currently disabled'}
              </Typography>
            </li>
          </Box>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Real-world Applications
          </Typography>

          <Typography variant="body1" paragraph>
            While our weasel simulation is a simple visualization, genetic algorithms are used to solve
            complex real-world problems like:
          </Typography>

          <Box component="ul" sx={{ pl: 4 }}>
            <li>
              <Typography variant="body1">
                Optimizing delivery routes for logistics companies
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Designing computer networks with optimal connectivity
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Creating schedules for staff, classrooms, or manufacturing
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Training neural networks and other machine learning models
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Designing more efficient mechanical parts and structures
              </Typography>
            </li>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant="body1" paragraph>
          Feel free to experiment with the simulation! Try changing the number of food sources,
          observe what happens when you trigger an earthquake, or {withBadger ? 'watch how the weasel adapts to avoid the predator while still gathering food efficiently' : 'toggle on the predator to add an extra challenge'}.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 4, fontStyle: 'italic' }}>
          This interactive demonstration is based on simplified genetic algorithm principles and
          is intended for educational purposes.
        </Typography>
      </Paper>
    </Container>
  );
};

export default GeneticAlgorithmPost;