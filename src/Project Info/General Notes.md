# Project Purpose
  - Develop a personal blog application using modern front end web tools.  
  - The blog app should be able to host multiple blogs using the same app and DB.
  - All the blogs will be my personal blogs.

# My Biography
I am a 75 year old male, still working as a fulltime software architect on a contract basis.  I have been developing software for decades, most of it in backend architecture and DB Design.  I have been using .Net C# since verson Framework 1.1, Entity Framework, and SQL Server hosted in Azure.

I have very little front-end experience except for Winforms and Blazor.  I have written a small amount of javascript, no Typescript, and very little CSS.   

## Technology Stack
- Frontend: React with TypeScript and Material UI, Vite components
- Backend: Wordpress as headless CMS hosted at Hostinger.com
- Hosting: Vercel for the React frontend, WordPress.com for the backend
- Architecture: Headless CMS approach using WordPress REST API

### Frontend
- React/Vite client using Material UI components.
- Using TypeScript for better type safety.
- Adopting Material UI for a polished, professional look
- Componentized design with services for API access
- Unit tests using Vitest framework.
- Hosting at Vercel connected to Github/main branch.
- URL at Vercel is https://blog-client-three-psi.vercel.app
- Domain thechief.com is kept at Network Solutions
- Domain netservers now point to a proxy domain at Cloudshare.

### Backend & Hosting
- Wordpress Premium plan at Hostinger.com to enable full REST API access
- Currently hosted at https://wpcms.thechief.com.
- WordPress multisite capability to support multiple blogs (domain1.com/blog1, domain2.com/blo2, etc.)
- WP is configured for three sites: wa1x, applefinch, and the default headless site for development.
- WA1X is a ham radio blog.   Applefinch is a blog about science and the scientific method.
- Vercel hosting for the frontend (connects to GitHub, generous free tier)

- I am the only admin since all the blogs will be mine.
- I will use the Wordpress Admin for all configuration and content management.

### Development Approach
- Using Visual Code for development.
- Using cmd window to run npm commands.
- Creating discrete components and services using Vite components.
- Leveraging TypeScript interfaces for WordPress API responses
- Incremental development with component-based approach
- Github repository setup and check-ins via Visual Code.
- Development is done in main branch.  Periodic merges to release branch.
- Chats and resource under the XBlog project in Claude.ai
- Chats usually are loaded with src folder from Git repository.
- All client development is done by Claude.
- All except trivial updates, I request the full updated file in artfact form.

## Accomplished so far
- Set up Visual Studio development environment. 
- Set up initial React + TypeScript + Material UI project, Vite 
- Make simple Home page to test the client development setup.
- Make backup of Wordpress initial installation.
- Wordpress plugins installed for API
  - ACF to REST API
  - Advanced Custom Fields
  - JWT Authentication for WP-API
  - WP REST API Controller 
  - WP REST Cache
  - WP-REST-API V2 Menus
  - WordPress REST API Authentication 
  - Better REST API Featured Image (see development details below)
- Test url https://wpcms.thechief.com/wp-json/wp/v2/categories still works.
- Installed unit test framework.
  - Vitest: A Vite-native test runner
  - jsdom: For simulating a browser environment
  - React Testing Library: For testing React components
  - MSW (Mock Service Worker): For mocking API requests
  - Ran Claude-suggested unit test wordpressApi.test.ts.  (successful)
- Implemented Layout Components (in src/components/layout/):
  - Sidebar.tsx - The left sidebar with search, categories, tags, and admin links
  - Header.tsx - The navigation header with mobile drawer
  - Footer.tsx - The page footer
- Implemented Post Components (in src/components/posts/):
  - PostCard.tsx - Horizontal card layout for post previews
  - PostList.tsx - List of posts with pagination
  - PostDetail.tsx - Single post view
- Add src/interfaces.ts
- Added Pages
  - CategoryPosts.tsx
  - TagPosts.tsx
- Updated pages:
  - Home.tsx - Updated to use PostList and feature a hero section
  - App.tsx - Updated to use all the new components
- Claude has access to the public GitHub at https://github.com/chiefley/blog-client/
- Wordpress site is now configured for multisite. It has three sites.
  - The original site at wpcms.thechief.com.  This will only be used as the "Network Admin" site.
  - A blog site called WA1X at wpcms.thechief.com/wa1x  This will be ham radio related.
  - A blog site called The Apple and the Finch at wpcms.thechief.com/applefinch. This will be related to articles about evolution and other topics in science.
- Implemented Basic Authentication with base64 encoding as per the  WordPress REST API Authentication wordpress plugin.
- Componentized the sections in the Sidebar.
- Hierarchical Categories in client.
- Category and tag display on post cards
- Proper URL structure for slug-based navigation
- Type-safe components with well-defined interfaces

## Next Steps
- Work on any UI design details.
- Polish the current functionality 
- Test thoroughly across devices and browsers to ensure responsiveness works well
- Implement comments functionality - Add the ability for users to view and post comments
- Implement domain-specific theming - Add support for different themes based on the domain or blog
- Add analytics integration - Implement tracking to monitor user behavior
- Optimize performance - Look into options like code splitting, lazy loading, and image optimization


#Development Details
- Parsing info from Better REST Featured Image plugin.   This fix below was necessary as the signature is different than what was anticipated:

Instead of adding a featured_media_url field as we originally anticipated, the plugin adds a comprehensive better_featured_image object to each post, which contains all the image details including different sizes.

"better_featured_image": {
  "id": 557,
  "alt_text": "",
  "caption": "",
  "description": "",
  "media_type": "image",
  "media_details": {
    "width": 800,
    "height": 532,
    "sizes": {
      "medium": {
        "source_url": "https://wpcms.thechief.com/wp-content/uploads/2021/01/childcare-template-blog-img-3-300x200.jpg"
      }
    }
  },
  "source_url": "https://wpcms.thechief.com/wp-content/uploads/2021/01/childcare-template-blog-img-3.jpg"
}