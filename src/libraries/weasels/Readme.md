# Weasel Genetic Algorithm Simulation

This simulation models weasels finding food sources using a genetic algorithm. It demonstrates evolutionary principles like selection, mutation, and fitness in a visually engaging way.

## Key Genetic Algorithm Features

The simulation implements a genetic algorithm with the following key components:

1. **DNA Structure**: Each weasel has DNA represented as a tree structure of genes
    - Each gene has a position (stop) where the weasel can potentially find food
    - Genes connect to form a path the weasel travels

2. **Fitness Function**: Fitness is calculated based on:
    - Calories spent walking (distance between stops)
    - Calories acquired from nearby food sources
    - Penalties from a predator (badger) if enabled

3. **Mutation Types**:
    - Move a stop to a new location
    - Add a new stop
    - Delete a stop
    - Move a path to connect different stops
    - Insert a stop between two existing stops

4. **Selection**: The fittest weasel from each generation becomes the parent for the next

## Customization

You can adjust these parameters to customize the simulation:

1. **Mutation Level (1-5)**: Controls how many different mutation types are possible
    - Higher values allow more diverse mutations
    - Example: `initWeaselSimulation(container, 5, true)` enables all 5 mutation types

2. **Food Sources (5-100)**: Number of food sources in the environment
    - More food sources create more complex optimization problems
    - This can be adjusted via the UI input field or set programmatically

3. **With Badger (true/false)**: Whether to include a predator in the simulation
    - When enabled, weasels need to balance food gathering with predator avoidance
    - Example: `initWeaselSimulation(container, 5, false)` disables the badger

## How to Use

```typescript
import { initWeaselSimulation } from './libraries/weasels';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('weasel-container');
    if (container) {
        // Initialize with 3 mutation types and enable badger
        const simulation = initWeaselSimulation(container, 3, true);
    }
});
```

## HTML Requirements

The container element must have the following structure:

```html
<div id="weasel-container">
    <canvas class="field" width="1000" height="1000"></canvas>
    <div class="controls">
        <label>Food Sources: <input type="number" class="txtNumSources" value="15" min="5" max="100" /></label>
        <button class="btnReset">Reset</button>
        <button class="btnRun">Run</button>
        <button class="btnStop">Stop</button>
        <button class="btnSingleStep">Single Step</button>
        <button class="btnEarthquake">Earthquake</button>
    </div>
    <div class="stats">
        <div>Generations: <span class="lblGenerations">0</span></div>
        <div>Calories Spent: <span class="lblSpentCalories">0</span></div>
        <div>Calories Acquired: <span class="lblAcquiredCalories">0</span></div>
        <div>Net Calories: <span class="lblNetCalories">0</span></div>
    </div>
</div>
```