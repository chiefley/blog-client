# Server Design
 - Headless WordPress hosted at Hostinger at https://wpcms.thechief.com under a Premium plan.
- WordPress multisite capability to support multiple blogs (domain1.com/blog1, domain2.com/blo2, etc.)
- Currently, three blogs:  wa1x, applefinch, and the default headless site.

## WordPress Plugins
  - ACF to REST API
  - Advanced Custom Fields
  - Default Featured Image
  - Disable WP REST API
  - WP REST API Controller 
  - Enable CORS
  - Hostinger Easy Onboarding
  - Hostinger Tools
  - Image Optimization Service by Optimole
  - LiteSpeed Cache
  - User Role Editor
  - WP REST Cache
  - WP-REST-API V2 Menus
  - WordPress REST API Authentication configured for JWT Authentication.
  - Better REST API Featured Image (see development details below)
  - Max Mega Menu
  - Shortcodes Ultimate

## Development Details
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