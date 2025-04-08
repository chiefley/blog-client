# Image Handling Strategy

## Overview
This document details the image handling approach used in the React blog client application. Our image handling strategy focuses on optimization, performance, and fallback mechanisms to ensure a consistent user experience across various devices and network conditions.

## Key Components

### 1. LazyImage Component
Located in `src/components/common/LazyImage.tsx`, this is a custom component that:

- **Lazy loads images** only when they are close to the viewport using `IntersectionObserver`
- Provides **loading animations** with Material UI's `Skeleton` component
- Implements **error handling** with fallback images
- Supports custom styling and layout options
- Maintains proper aspect ratios and responsive sizing

```typescript
// Basic usage example
<LazyImage
  src={imageUrl}
  alt="Image description"
  width="100%"
  height={250}
  objectFit="cover"
  borderRadius={1}
  loadingHeight={250}
  fallbackSrc="https://via.placeholder.com/300x200"
/>
```

### 2. WordPress REST API Integration

The application handles image retrieval from WordPress in several ways, with fallback mechanisms:

#### Priority Order for Featured Images:
1. `better_featured_image` from Better REST API Featured Image plugin
2. `featured_media_url` (older method)
3. Embedded media from `_embedded['wp:featuredmedia']`
4. Default placeholder image

#### Better REST Featured Image Plugin Structure

Initially, we expected the plugin to add a simple `featured_media_url` field to each post. However, the actual implementation provides a more comprehensive `better_featured_image` object with complete image details:

```json
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
```

This structure provides several advantages:
- Access to multiple image sizes through the `media_details.sizes` object
- Additional metadata like alt text, captions, and dimensions
- Better support for accessibility with the `alt_text` field
- Direct access to the original source URL via `source_url`

This priority order is implemented in components like `FeaturedArticle.tsx` and `PostCard.tsx`:

```typescript
// Example from FeaturedArticle.tsx
const getFeaturedImage = () => {
  // First check if better_featured_image is available
  if (post.better_featured_image) {
    // Try to get medium_large or medium size if available
    if (post.better_featured_image.media_details?.sizes) {
      if (post.better_featured_image.media_details.sizes.medium_large) {
        return post.better_featured_image.media_details.sizes.medium_large.source_url;
      }
      if (post.better_featured_image.media_details.sizes.medium) {
        return post.better_featured_image.media_details.sizes.medium.source_url;
      }
    }
    
    // Fall back to full size
    return post.better_featured_image.source_url;
  }
  
  // Check for featured_media_url (older way)
  if (post.featured_media_url) {
    return post.featured_media_url;
  }
  
  // Fall back to the embedded media if available
  if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
    const media = post._embedded['wp:featuredmedia'][0];
    
    // Try to get medium size if available
    if (media.media_details && media.media_details.sizes) {
      if (media.media_details.sizes.medium && media.media_details.sizes.medium.source_url) {
        return media.media_details.sizes.medium.source_url;
      }
    }
    
    // Fall back to source URL
    return media.source_url;
  }
  
  // Default image if none is available
  return 'https://via.placeholder.com/1200x500';
};
```

### 3. Responsive Image Optimization with Optimole

The application uses utility functions in `src/utils/imageUtils.ts` to optimize images for different screen sizes:

- `isOptimoleUrl`: Detects if an image URL is already served through Optimole
- `getOptimizedImageUrl`: Adds resize parameters to an Optimole URL
- `getResponsiveImageUrl`: Creates responsive image URLs with breakpoints for mobile, tablet, and desktop

```typescript
// Example usage in a component
const responsiveImageUrl = featuredImageUrl ? getResponsiveImageUrl(featuredImageUrl, {
  mobile: { width: 480, height: 250 },
  tablet: { width: 768, height: 300 },
  desktop: { width: 1200, height: 400 },
  quality: 85
}) : '';
```

### 4. Content Image Enhancement

In `PostDetail.tsx`, the application enhances images in post content with:

- **Lazy loading** for all content images using the `loading="lazy"` attribute
- **Responsive sizing** with `max-width: 100%` and `height: auto`
- **Optimization** through Optimole when available
- **Styling consistency** with border radius and other style properties

```typescript
// Example from PostDetail.tsx - enhancing content images
const enhanceContent = (content: string): React.ReactNode => {
  const parsed = parse(content, {
    replace: (domNode) => {
      if (domNode.type === 'tag' && domNode.name === 'img') {
        const src = domNode.attribs?.src || '';
        const alt = domNode.attribs?.alt || '';
        
        // Process with Optimole if present
        const responsiveImageUrl = getResponsiveImageUrl(src, {
          mobile: { width: 480 },
          tablet: { width: 768 },
          desktop: { width: 1200 },
          quality: 80
        });
        
        return (
          <img 
            src={responsiveImageUrl}
            alt={alt} 
            loading="lazy"
            style={{ maxWidth: '100%', height: 'auto', borderRadius: 1 }}
          />
        );
      }
      return domNode;
    }
  });
  
  return parsed;
};
```

## WordPress Configuration

### Plugins Used for Image Handling

- **Better REST API Featured Image**: Enhances the WordPress REST API with comprehensive image details
- **Image Optimization Service by Optimole**: Provides CDN and responsive image functionality
- **LiteSpeed Cache**: Helps with image caching and general performance

### Image Size Details from WordPress

The application leverages WordPress's image sizes:
- `thumbnail`: Small preview images
- `medium`: Used in post lists and cards (typically 300px width)
- `medium_large`: Used for featured articles (typically 768px width)
- Original/full size: Used as fallback or for large displays

## Best Practices & Maintenance

### When Adding New Image Features:

1. **Always use the LazyImage component** for standalone images to maintain consistency and performance
2. **Follow the fallback pattern** when retrieving featured images from WordPress
3. **Use the responsive image utilities** to optimize for different screen sizes
4. **Set appropriate width/height attributes** to prevent layout shifts during loading
5. **Include fallback images** for error cases
6. **Test across multiple devices** to ensure responsive behavior works correctly

### Potential Future Improvements:

1. Implement WebP support via Optimole or WordPress configuration
2. Add next-gen image format detection and fallbacks
3. Consider implementing image preloading for critical images
4. Add support for art direction with different aspect ratios per device
5. Integrate with Core Web Vitals monitoring to track performance impact

## Troubleshooting Common Issues

### Missing Images:
- Verify the WordPress featured image is set
- Check if WordPress plugins are active and configured
- Verify post has proper attachment in WordPress media library

### Performance Issues:
- Check if Optimole is properly configured
- Verify image dimensions match usage context
- Check if too many large images are being loaded at once

### Layout Shifts:
- Ensure width/height attributes are set correctly
- Verify aspect ratios are consistent between WordPress and frontend
- Use appropriate loadingHeight in LazyImage component