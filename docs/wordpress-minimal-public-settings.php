<?php
/**
 * Minimal public site info endpoint - exposes only essential settings
 * Add this to your WordPress theme's functions.php or create a mu-plugin
 */

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
}