# Core Dependencies and Versions

## Overview
This document tracks the core dependencies and their versions used in the React blog client application. Maintaining this information helps prevent compatibility issues during upgrades and ensures consistent development environments.

## How to Update This Document

1. **Regularly review the package.json file** and update this document when dependencies change
2. **Document any version-specific features or requirements**
3. **Note any dependencies that cannot be safely upgraded** without significant code changes
4. **Track minimum required WordPress version** for API compatibility

## Frontend Dependencies

### React Core
- **React**: ^18.2.0
- **React DOM**: ^18.2.0
- **React Router DOM**: ^6.4.0
- **TypeScript**: ^5.0.0

### UI Framework
- **Material UI (MUI)**: ^5.14.0
- **MUI Icons**: ^5.14.0
- **Emotion** (MUI dependency): ^11.11.0

### API & Data Handling
- **HTML React Parser**: ^4.2.0
- **Date-fns**: ^2.30.0

### Build Tools
- **Vite**: ^4.4.0
- **TypeScript**: ^5.0.0
- **ESLint**: ^8.44.0
- **Prettier**: ^3.0.0

## Testing Dependencies
- **Vitest**: ^0.34.0
- **React Testing Library**: ^14.0.0
- **jsdom**: ^22.1.0
- **MSW (Mock Service Worker)**: ^1.2.0

## WordPress Requirements

### API Version
- **WordPress REST API**: v2
- **Minimum WordPress Version**: 5.9.0 (for complete REST API support)

### Required WordPress Plugins
- **ACF to REST API**
- **Advanced Custom Fields**
- **JWT Authentication for WP-API** (if using JWT)
- **WP REST API Controller**
- **WP REST Cache**
- **WordPress REST API Authentication**
- **Better REST API Featured Image**

## Browser Compatibility

This project is built to support:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome for Android)

## Version-Specific Notes

### Material UI v5
- Uses Emotion instead of JSS for styling
- Requires different import paths compared to MUI v4
- Component props may differ from MUI v4

### React Router v6
- Uses different routing patterns compared to v5
- Component-based routing with `<Routes>` and `<Route>`
- No more `<Switch>` component

### Vite
- Different configuration compared to Create React App
- Uses ESM imports by default
- Environment variables require `import.meta.env` prefix

## Upgrading Guidelines

When upgrading dependencies:

1. **Review changelogs** for breaking changes
2. **Test thoroughly** after upgrading major versions
3. **Update one major dependency at a time** to isolate issues
4. **Consider TypeScript types** compatibility with library updates

## Checking Current Versions

### Using npm
```bash
npm list --depth=0
```

### Using yarn
```bash
yarn list --depth=0
```

### Front-end Build Info
You can add a version display component to your application that shows:
- Application version (from package.json)
- Build timestamp
- Environment (development/production)

## Version Control Strategy

1. **Lock Versions**: Use exact versions in package.json (e.g., "5.14.1" not "^5.14.1") for critical dependencies
2. **Renovate/Dependabot**: Consider using automated dependency update tools
3. **Regular Audits**: Run `npm audit` or `yarn audit` regularly
4. **Test Suite**: Ensure your test suite covers critical functionality that might break during updates

## Document Maintenance

This document should be updated:
- After any significant dependency upgrade
- When adding new major dependencies
- Before starting a new development cycle
- As part of regular codebase maintenance

Last updated: 4/7/2025