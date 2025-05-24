// src/components/embedded/ComponentRegistry.tsx
import React, { ComponentType } from 'react';
import OptimizedWeaselSimulation from '../common/OptimizedWeaselSimulation';
// Import other embeddable components here

// Define the interface for component props
type ComponentProps = Record<string, any>;

// Registry mapping component names to actual components
const COMPONENT_REGISTRY: Record<string, ComponentType<any>> = {
  'GeneticAlgorithm': OptimizedWeaselSimulation,
  // Add more components as needed:
  // 'ChartComponent': ChartComponent,
  // 'InteractiveMap': InteractiveMap,
};

interface EmbeddedComponentProps {
  componentName: string;
  props: ComponentProps;
}

/**
 * Renders a component from the registry with the provided props
 */
export const EmbeddedComponent: React.FC<EmbeddedComponentProps> = ({ 
  componentName, 
  props 
}) => {
  const Component = COMPONENT_REGISTRY[componentName];
  
  if (!Component) {
    console.warn(`Component "${componentName}" not found in registry`);
    return (
      <div style={{ 
        padding: '20px', 
        border: '2px dashed #ccc', 
        textAlign: 'center',
        color: '#666'
      }}>
        Component "{componentName}" not available
      </div>
    );
  }

  // Convert string props to appropriate types
  const processedProps = processProps(props);
  
  return <Component {...processedProps} />;
};

/**
 * Process props to convert strings to appropriate types
 */
function processProps(props: ComponentProps): ComponentProps {
  const processed: ComponentProps = {};
  
  for (const [key, value] of Object.entries(props)) {
    // Convert string values to appropriate types
    if (value === 'true') {
      processed[key] = true;
    } else if (value === 'false') {
      processed[key] = false;
    } else if (!isNaN(Number(value)) && value !== '') {
      processed[key] = Number(value);
    } else {
      processed[key] = value;
    }
  }
  
  return processed;
}

/**
 * Parse WordPress content and replace component markers with React components
 */
export function parseEmbeddedComponents(content: string): React.ReactNode {
  // Split content by component markers
  const parts = content.split(/(<div class="react-component"[^>]*><\/div>)/);
  
  return parts.map((part, index) => {
    // Check if this part is a component marker
    const componentMatch = /<div class="react-component" data-component="([^"]*)" data-props="([^"]*)"><\/div>/.exec(part);
    
    if (componentMatch) {
      const [, componentName, propsJson] = componentMatch;
      
      try {
        const props = JSON.parse(propsJson.replace(/&quot;/g, '"'));
        return (
          <EmbeddedComponent 
            key={`component-${index}`}
            componentName={componentName}
            props={props}
          />
        );
      } catch (error) {
        console.error('Failed to parse component props:', error);
        return (
          <div key={`error-${index}`} style={{ color: 'red', padding: '10px' }}>
            Error loading component: {componentName}
          </div>
        );
      }
    }
    
    // Regular content - parse as HTML
    if (part.trim()) {
      return <div key={`content-${index}`} dangerouslySetInnerHTML={{ __html: part }} />;
    }
    
    return null;
  }).filter(Boolean);
}