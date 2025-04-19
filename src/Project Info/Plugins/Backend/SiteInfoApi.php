<?php
/**
 * Plugin Name: Site Info API
 * Description: Creates a simple endpoint to access basic site information with any authenticated user
 * Version: 1.1
 * Author: Claude
 * Network: true
 */

// Register the custom REST API endpoint
add_action('rest_api_init', function () {
    register_rest_route('site-info/v1', '/basic', array(
        'methods' => 'GET',
        'callback' => 'get_basic_site_info',
        'permission_callback' => function() {
            // Allow any authenticated user - more permissive than before
            return is_user_logged_in();
        }
    ));
    
    // Add a fully public endpoint as well
    register_rest_route('site-info/v1', '/public', array(
        'methods' => 'GET',
        'callback' => 'get_basic_site_info',
        'permission_callback' => '__return_true' // Allow anyone to access this endpoint
    ));
});

/**
 * Callback function to return basic site information
 * 
 * @return array Basic site information
 */
function get_basic_site_info() {
    // Get site logo ID if available
    $site_logo_id = get_theme_mod('custom_logo');
    
    // Get site icon
    $site_icon_id = get_option('site_icon');
    
    // Build the response array
    $site_info = array(
        'name' => get_bloginfo('name'),
        'description' => get_bloginfo('description'),
        'url' => get_bloginfo('url'),
        'home' => home_url(),
        'site_logo' => $site_logo_id,
        'site_icon' => $site_icon_id,
        'language' => get_bloginfo('language'),
        'timezone' => wp_timezone_string(),
        'gmt_offset' => get_option('gmt_offset'),
        'date_format' => get_option('date_format')
    );
    
    // Add logo URLs if available
    if (!empty($site_logo_id)) {
        $site_info['logo_url'] = wp_get_attachment_url($site_logo_id);
        
        // Add various logo sizes
        $logo_sizes = array('thumbnail', 'medium', 'large', 'full');
        foreach ($logo_sizes as $size) {
            $logo_data = wp_get_attachment_image_src($site_logo_id, $size);
            if ($logo_data) {
                $site_info['logo_' . $size] = $logo_data[0];
            }
        }
    }
    
    // Add site icon URL if available
    if (!empty($site_icon_id)) {
        $site_info['icon_url'] = wp_get_attachment_url($site_icon_id);
    }
    
    // Return the site information
    return $site_info;
}

// Add CORS headers to make sure our endpoint is accessible
function add_cors_headers() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
        status_header(200);
        exit();
    }
}

add_action('rest_api_init', function() {
    // Add the CORS headers to our endpoint
    add_action('rest_pre_serve_request', 'add_cors_headers');
});