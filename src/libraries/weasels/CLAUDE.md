# Weasel Genetic Algorithm Library

## Overview
Genetic algorithm simulation demonstrating evolutionary principles through weasels finding food sources.

## Key Components

### Core Classes
- **DNA**: Tree structure representing weasel's path through stops
- **Gene**: Individual stop/node in the path with position data
- **SWeasel**: The weasel entity with DNA, fitness calculation, and mutation
- **SBadger**: Predator that affects weasel fitness when enabled
- **SWeaselWorld**: Environment containing food sources and simulation logic

### Mutation Types (5 levels)
1. **Move Stop**: Relocate a stop to new position
2. **Add Stop**: Insert new stop in the path
3. **Delete Stop**: Remove a stop from path
4. **Move Path**: Reconnect stops differently
5. **Insert Stop**: Add stop between existing stops

## Usage Pattern
```typescript
// React component usage
import { initWeaselSimulation } from '@/libraries/weasels';

// Initialize with mutation level and badger flag
const simulation = initWeaselSimulation(container, 5, true);
```

## Fitness Calculation
```typescript
// Fitness = calories acquired - calories spent - predator penalty
// Calories spent = distance traveled between stops
// Calories acquired = food collected at stops
// Predator penalty = proximity to badger (if enabled)
```

## Optimization Features
- **WeaselOptimizer**: Performance optimization wrapper
- Caches fitness calculations
- Reduces redundant computations
- Manages animation frame updates

## Component Integration
- Used in `OptimizedWeaselSimulation.tsx`
- Embedded via shortcode system
- Supports dynamic parameters via props

## Configuration Parameters
- `mutationLevel`: 1-5 (complexity of mutations)
- `withBadger`: Enable/disable predator
- `initialFoodSources`: 5-100 food items
- `height`: Canvas height in pixels
- `showControls`: Display UI controls

## Performance Considerations
- Use `OptimizedWeaselSimulation` component
- Limit food sources for better performance
- Consider disabling badger for faster evolution
- Monitor generation count for convergence

## Performance Optimizations (January 2025)

### 1. Object Pooling
- **Child Weasels**: 5000 weasels reused instead of created/destroyed each cycle
- **DNA Copying**: Point objects reused via `copyFrom()` method

### 2. Algorithmic Improvements
- **Spatial Indexing**: Grid-based food source lookup (O(n*m) → O(k*m))
- **No Array Copying**: Uses Set to track consumed food indices
- **Squared Distances**: Comparison without expensive calculations

### 3. Cache Management
- **Smart Invalidation**: Only affected caches cleared based on mutation type
  - Move operations: Only paths cache invalidated
  - Add/Delete: Both stops and paths caches invalidated

### 4. Speed Control
- **0.5x-50x range**: No artificial delays at high speeds
- **<10x**: Uses proportional intervals
- **≥10x**: Multiple cycles per animation frame

### Key Files Modified
- `sweaselworld.ts`: Object pooling, spatial index, food tracking
- `point.ts`: Added `copyFrom()` and `rangeFromSquaredApprox()`
- `dna.ts`: Reuses Point objects in `copyIn()`
- `sweasel.ts`: Smart cache invalidation
- `weaselOptimizer.ts`: Enhanced speed control
- `OptimizedWeaselSimulation.tsx`: Extended speed range