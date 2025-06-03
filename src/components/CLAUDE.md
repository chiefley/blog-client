# Component Development Guidelines

## Component Structure
```typescript
// Standard component template
import React from 'react';
import { Box, Typography } from '@mui/material';
import { ComponentProps } from '@/types/interfaces';

interface MyComponentProps extends ComponentProps {
  // Component-specific props
}

export const MyComponent: React.FC<MyComponentProps> = ({ ...props }) => {
  return (
    <Box>
      {/* Component content */}
    </Box>
  );
};
```

## Export Patterns
Always export components through feature index files:
```typescript
// components/feature/index.ts
export { ComponentA } from './ComponentA';
export { ComponentB } from './ComponentB';
```

## Common Components

### LazyImage
Used for ALL image loading with automatic optimization:
```typescript
<LazyImage
  src={imageUrl}
  alt="Description"
  width="100%"              // Can be number or string
  height={250}              // Specify to prevent layout shift
  objectFit="cover"         // CSS object-fit value
  borderRadius={1}          // MUI theme spacing
  loadingHeight={250}       // Height during skeleton loading
  fallbackSrc="https://via.placeholder.com/800x600"
/>
```

**Image URL Processing**:
```typescript
import { getResponsiveImageUrl } from '@/utils/imageUtils';

// For Optimole-served images
const optimizedUrl = getResponsiveImageUrl(imageUrl, {
  mobile: { width: 480, height: 320 },
  tablet: { width: 768, height: 512 },
  desktop: { width: 1200, height: 800 },
  quality: 85
});
```

### Material-UI Usage
- Prefer MUI components over custom styling
- Use `Box` for layout containers
- Use `Typography` for all text elements
- Use `sx` prop for styling when possible

## Component Categories

### Posts (`/posts`)
- `PostCard`: Card display for post lists
- `PostDetail`: Full post view with content
- `PostList`: Paginated post listings
- `FeaturedArticle`: Hero post display

### Comments (`/comments`)
- `Comments`: Main comment container
- `CommentList`: Recursive comment display
- `CommentForm`: New comment submission
- `CommentItem`: Individual comment display

### Layout (`/layout`)
- `Header`: Site header with navigation
- `Footer`: Site footer
- `Sidebar`: Categories, tags, search
- `AdminLinks`: Login/logout controls

### Common (`/common`)
- `LazyImage`: Optimized image component
- `LoginModal`: Authentication dialog
- `WeaselSimulation`: Genetic algorithm demo

## State Management
- Use React hooks for local state
- Use Context API for global state (Auth, SiteInfo)
- Avoid prop drilling - use context when needed

## Performance Patterns
```typescript
// Lazy loading heavy components
const LazyComments = React.lazy(() => import('./Comments'));

// Use in component
<Suspense fallback={<CircularProgress />}>
  <LazyComments postId={postId} />
</Suspense>
```

## TypeScript Conventions
- Define interfaces for all props
- Use generic types from `types/interfaces.ts`
- Avoid `any` type - use `unknown` if needed
- Export interfaces that might be reused

## Testing Components
- Test files in `__tests__` folders
- Use React Testing Library
- Test user interactions, not implementation
- Mock API calls with MSW

## Accessibility
- Always include alt text for images
- Use semantic HTML elements
- Ensure keyboard navigation works
- Test with screen readers

## Common Pitfalls to Avoid
- Don't use inline styles - use MUI's sx prop
- Don't forget error boundaries for dynamic content
- Don't skip loading states
- Don't hardcode URLs - use config