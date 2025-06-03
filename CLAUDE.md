# Blog Client Project

## Project Overview
React-based WordPress blog client with multisite support, optimized for deployment to subdirectories on multiple WordPress sites.

## Build & Deploy Commands
```bash
# Development
npm run dev              # Start Vite dev server

# Build
npm run build           # Build for deployment
npm run clean           # Clean build artifacts

# Deploy to specific sites
npm run deploy:wa1x     # Deploy to wa1x.thechief.com
npm run deploy:applefinch # Deploy to applefinch.thechief.com
npm run deploy:all      # Deploy to all configured sites

# Full build + deploy
npm run full            # Build and deploy to all sites
npm run full:wa1x       # Build and deploy to wa1x only
npm run full:applefinch # Build and deploy to applefinch only

# Testing & Linting
npm run lint            # Run ESLint
npm test                # Run Vitest tests
```

## WordPress API Integration
- Base API URL: Configured in environment variables
- Multisite paths: Defined in `src/config/multisiteConfig.ts`
- Authentication: JWT tokens stored in localStorage
- Draft posts: Only visible when authenticated
- API service: `src/services/wordpressApi.ts`

## Project Structure Patterns
- **Components**: `src/components/` - Organized by feature (posts, comments, layout, common)
- **Pages**: `src/pages/` - Route-level components
- **Services**: `src/services/` - API and external integrations
- **Types**: `src/types/interfaces.ts` - Shared TypeScript interfaces
- **Contexts**: `src/contexts/` - React contexts for auth and site info

## Component Conventions
- Use TypeScript for all components
- Export from feature index files (e.g., `components/posts/index.ts`)
- Lazy load heavy components (see `LazyComments.tsx` pattern)
- Image optimization via `LazyImage` component
- Use Material-UI components from `@mui/material`

## Key Features
- **Multisite Support**: Automatic blog detection based on URL
- **Image Optimization**: Lazy loading with placeholder blur
- **Comment System**: Nested comments with authentication
- **Weasel Simulation**: Genetic algorithm demonstration at `/weasel`
- **Admin Features**: Draft preview when logged in

## Deployment Architecture
- **Subdirectory Deployment**: Deploys to WordPress subdirectories (e.g., `/react-app/`)
- **Multi-Target Support**: Deploy to wa1x.thechief.com, applefinch.thechief.com, or all sites
- **Automated Process**: Uses `deploy.js` with FTP via basic-ftp package
- **Asset Path Handling**: Relative paths (`./`) for subdirectory compatibility
- **Configuration**: Environment variables in `.env` files (not committed)
- **Server Config**: `.htaccess` handles SPA routing and caching

## Image Handling Strategy
- **LazyImage Component**: Always use `src/components/common/LazyImage.tsx` for images
- **Optimole Integration**: Images automatically optimized via CDN when available
- **Responsive Images**: Use `getResponsiveImageUrl()` from `src/utils/imageUtils.ts`
- **Featured Image Priority**:
  1. `post.better_featured_image.source_url`
  2. `post.featured_media_url`
  3. `post._embedded['wp:featuredmedia']`
  4. Fallback placeholder
- **Content Images**: Auto-enhanced with lazy loading in PostDetail
- **Always specify dimensions** to prevent layout shifts

## Performance Optimizations
- Code splitting with React.lazy
- Image lazy loading with IntersectionObserver
- Vite build optimizations
- Compression plugin configured

## Testing Strategy
- Unit tests with Vitest
- React Testing Library for component tests
- MSW for API mocking
- Test files in `__tests__` directories

## Core Dependencies
- **React**: ^19.0.0 with TypeScript ^5.7.2
- **Material UI**: ^6.4.7 with Emotion ^11.14.0
- **Vite**: ^6.2.0 with React plugin ^4.3.4
- **React Router**: ^7.3.0 (v6+ patterns)
- **Utilities**: date-fns ^4.1.0, html-react-parser ^5.2.2
- **WordPress**: Requires WP 5.9+ with REST API v2

## Security Notes
- Never commit `.env` files
- JWT tokens expire and require re-authentication
- API endpoints use WordPress nonce verification
- CORS configured on WordPress side

## WordPress Configuration
- **Hosted at**: https://wpcms.thechief.com (Hostinger Premium Plan)
- **Multisite Setup**: WordPress multisite network enabled
- **Multisite Blogs**: 
  - Main: wpcms.thechief.com (network admin only)
  - WA1X: wpcms.thechief.com/wa1x (ham radio blog)
  - AppleFinch: wpcms.thechief.com/applefinch (science/evolution blog)

### WordPress Plugins
- **API Enhancement**: Better REST API Featured Image, ACF to REST API, WP REST API Controller
- **Performance**: LiteSpeed Cache, WP REST Cache, Image Optimization Service by Optimole
- **Security**: JWT Authentication for WP-API, User Role Editor, Enable CORS
- **Menu/Content**: WP-REST-API V2 Menus, Advanced Custom Fields, Shortcodes Ultimate
- **Hosting**: Hostinger Tools, Hostinger Easy Onboarding

### API User Setup
1. Create WordPress user with "Subscriber" role
2. Use User Role Editor plugin to create custom "API User" role
3. Grant only: `read`, `read_posts`, `read_private_posts` capabilities
4. Configure JWT in `.htaccess` and `wp-config.php`:
   ```php
   define('JWT_AUTH_SECRET_KEY', 'your-secret-key');
   define('JWT_AUTH_CORS_ENABLE', true);
   ```
5. Store credentials in `.env.local` (never commit)

## Custom Shortcode System
Embed React components in WordPress posts:
```
[genetic-algorithm mutation-level="5" with-badger="true"]
```
- **WordPress**: Shortcode → HTML marker with data attributes
- **React**: ComponentRegistry parses and renders components
- **Registration**: Add to `COMPONENT_REGISTRY` in `ComponentRegistry.tsx`
- **PHP**: Add shortcode handler to WordPress functions.php

## Common Tasks
- Adding a new blog: Update `multisiteConfig.ts`
- Creating components: Follow existing patterns in components folder
- API changes: Update interfaces in `types/interfaces.ts`
- Deploy issues: Check FTP credentials in `.env`
- New shortcode: Add to both WordPress and ComponentRegistry

## Import Additional Configs
@src/components/CLAUDE.md
@src/services/CLAUDE.md
@src/libraries/weasels/CLAUDE.md
@deployment/CLAUDE.md