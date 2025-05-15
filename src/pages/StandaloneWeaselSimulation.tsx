import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import WeaselSimulation from '../components/common/WeaselSimulation';

/**
 * A standalone page for testing the weasel simulation without requiring WordPress API
 */
const StandaloneWeaselSimulation: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Weasel Genetic Algorithm Simulation
      </Typography>

      <Typography variant="body1" paragraph>
        This is a standalone implementation of the weasel genetic algorithm simulation.
        You can use this page for testing and development while the WordPress API is unavailable.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <WeaselSimulation
          mutationLevel={3}
          withBadger={true}
          initialFoodSources={15}
          height={500}
        />
      </Box>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Controls
      </Typography>

      <Box component="ul" sx={{ mb: 4 }}>
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
      </Box>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={() => window.location.href = '/'}
          sx={{ mr: 2 }}
        >
          Return to Home
        </Button>
      </Box>
    </Container>
  );
};

export default StandaloneWeaselSimulation;
