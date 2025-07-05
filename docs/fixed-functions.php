<?php
// Child theme functions
function thechief_child_enqueue_styles() {
    wp_enqueue_style('parent-style', get_template_directory_uri() . '/style.css');
    wp_enqueue_style('child-style', get_stylesheet_directory_uri() . '/style.css', array('parent-style'));
}
add_action('wp_enqueue_scripts', 'thechief_child_enqueue_styles');

// Make sure REST API can access site info from this child theme
function ensure_rest_access() {
    remove_filter('rest_authentication_errors', 'disable_rest_api_for_non_logged_in_users');
}
add_action('init', 'ensure_rest_access');

// ============================================
// Disable shortcode processing for REST API
// ============================================
// This allows the React client to handle all shortcode parsing
// while keeping shortcodes functional in the WordPress admin
add_filter('rest_prepare_post', function($response, $post, $request) {
    // Get the raw content without shortcode processing
    $raw_content = $post->post_content;

    // Override the rendered content with raw content
    if (isset($response->data['content']['rendered'])) {
        // Temporarily remove shortcode processing
        remove_filter('the_content', 'do_shortcode', 11);

        // Apply other content filters (wpautop, etc) but not shortcodes
        $response->data['content']['rendered'] = apply_filters('the_content', $raw_content);

        // Restore shortcode processing for non-API requests
        add_filter('the_content', 'do_shortcode', 11);
    }

    return $response;
}, 10, 3);

// ============================================
// Optional: Add raw_content field to REST API
// ============================================
// This provides both rendered and raw content options
add_action('rest_api_init', function() {
    register_rest_field('post', 'raw_content', array(
        'get_callback' => function($post) {
            return get_post($post['id'])->post_content;
        },
        'schema' => array(
            'description' => 'Raw post content with unprocessed shortcodes',
            'type' => 'string',
            'context' => array('view', 'edit')
        )
    ));
});

// Create a custom REST endpoint that exposes only the settings we need
function register_minimal_public_site_info() {
    register_rest_route('site-info/v1', '/public', [
        'methods' => 'GET',
        'callback' => 'get_minimal_public_site_info',
        'permission_callback' => '__return_true', // Make it public
    ]);
}
add_action('rest_api_init', 'register_minimal_public_site_info');

// Return only the essential site information
function get_minimal_public_site_info($request) {
    return [
        'name' => get_option('blogname'),
        'description' => get_option('blogdescription'), // The tagline!
        'url' => get_option('siteurl'),
        'home' => get_option('home'),
        'gmt_offset' => (float) get_option('gmt_offset'),
        'timezone_string' => get_option('timezone_string'),
        'site_logo' => null // Add logo logic here if needed
    ];
}  // <-- THIS WAS MISSING!

?>