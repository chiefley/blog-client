# WordPress Blog Client

A modern React-based client for WordPress blogs with multisite support, client-side shortcode parsing, and simple token-based authentication.

## Features

- 🌐 **Multisite Support** - Automatic detection and routing for multiple WordPress blogs
- 🔐 **Simple Authentication** - Token-based auth with draft post preview
- 📝 **Client-Side Shortcode Parsing** - Parse WordPress shortcodes directly in React
- 🖼️ **Optimized Images** - Lazy loading with Optimole CDN integration
- 💬 **Nested Comments** - Full comment system with authentication
- 🧬 **Interactive Demos** - Genetic algorithm simulations
- 📱 **Responsive Design** - Mobile-first with Material-UI

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build for production
npm run build

# Deploy to specific site
npm run deploy:wa1x
npm run deploy:applefinch
npm run deploy:all
```

## Project Structure

```
blog-client/
├── src/
│   ├── components/         # React components
│   │   ├── posts/         # Post-related components
│   │   ├── comments/      # Comment system
│   │   ├── layout/        # Header, footer, sidebar
│   │   ├── common/        # Shared components
│   │   └── shortcodes/    # Shortcode components
│   ├── contexts/          # React contexts
│   ├── pages/             # Route pages
│   ├── services/          # API services
│   ├── types/             # TypeScript interfaces
│   └── utils/             # Utilities
├── wordpress-simple-auth/  # WordPress plugin
└── deployment/            # Deployment scripts
```

## Authentication

The project uses **Simple Auth**, a custom WordPress plugin that provides reliable token-based authentication:

- No complex JWT configuration
- Tokens stored in database
- Automatic draft post access
- Built-in CORS handling

See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed documentation.

## Shortcode System

WordPress shortcodes are parsed client-side in React:

```
[su_box title="Info" style="glass"]Content[/su_box]
[su_tabs][su_tab title="Tab 1"]Content[/su_tab][/su_tabs]
[genetic-algorithm mutation-level="5"]
```

- Parser: `src/utils/shortcodeParser.ts`
- Components: `src/components/shortcodes/`
- Add new shortcodes by creating components and registering them

## Configuration

### Environment Variables

Create `.env.local`:
```env
VITE_WP_API_BASE_URL=https://wpcms.thechief.com
```

### WordPress Setup

1. Install WordPress with multisite enabled
2. Install required plugins:
   - Simple Auth for REST API (included)
   - Better REST API Featured Images
   - Shortcodes Ultimate
3. Configure permalinks
4. Create API user with read permissions

### Multisite Configuration

Edit `src/config/multisiteConfig.ts`:
```typescript
export const blogs = {
  wa1x: {
    id: 'wa1x',
    name: 'WA1X Ham Radio',
    domain: 'wa1x.thechief.com',
    wpPath: 'wa1x'
  },
  // Add more blogs...
};
```

## Deployment

The app deploys to WordPress subdirectories via FTP:

```bash
# Build and deploy to all sites
npm run full

# Deploy to specific site
npm run full:wa1x
```

Deployment configuration in `.env`:
```env
FTP_HOST=your-host.com
FTP_USER=username
FTP_PASSWORD=password
FTP_WA1X_PATH=/public_html/react-app
```

## Development

### Key Technologies
- **React 19** with TypeScript
- **Material-UI** for components
- **Vite** for bundling
- **React Router** for navigation
- **Vitest** for testing

### Testing
```bash
# Run tests
npm test

# Run specific test
npm test shortcode
```

### Code Style
- TypeScript for all components
- Functional components with hooks
- Material-UI sx prop for styling
- Lazy loading for heavy components

## Documentation

- [AUTHENTICATION.md](./AUTHENTICATION.md) - Auth system details
- [MIGRATION_TO_SIMPLE_AUTH.md](./MIGRATION_TO_SIMPLE_AUTH.md) - Migration guide
- [CLAUDE.md](./CLAUDE.md) - AI assistant instructions
- `src/components/shortcodes/README.md` - Shortcode development

## Troubleshooting

### Build Issues
- Clear `node_modules` and reinstall
- Check TypeScript errors with `npm run build`

### Auth Issues
- Verify Simple Auth plugin is activated
- Check CORS origins in plugin
- Clear browser localStorage

### Deployment Issues
- Verify FTP credentials
- Check file permissions
- Ensure `.htaccess` is uploaded

## Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Test on both development and production

## License

Private project - All rights reserved