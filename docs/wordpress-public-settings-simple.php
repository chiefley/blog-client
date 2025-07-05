<?php
/**
 * Simple version: Make WordPress settings publicly accessible
 * Add this to your WordPress theme's functions.php or as a mu-plugin
 */

// Make the /wp-json/wp/v2/settings endpoint publicly accessible
function make_settings_endpoint_public($result, $server, $request) {
    // Check if this is a GET request to the settings endpoint
    if ($request->get_method() === 'GET' && 
        strpos($request->get_route(), '/wp/v2/settings') !== false) {
        // Allow public access to GET requests only
        return true;
    }
    
    return $result;
}
add_filter('rest_authentication_errors', 'make_settings_endpoint_public', 10, 3);

// Alternative approach: Override the permission callback for settings endpoint
function override_settings_permissions() {
    global $wp_rest_server;
    
    if (!$wp_rest_server) {
        return;
    }
    
    $routes = $wp_rest_server->get_routes();
    
    // Find and modify the settings endpoint
    foreach ($routes as $route => $endpoints) {
        if (strpos($route, '/wp/v2/settings') !== false) {
            foreach ($endpoints as $key => $endpoint) {
                if (isset($endpoint['methods']) && 
                    ($endpoint['methods'] === 'GET' || $endpoint['methods'] === WP_REST_Server::READABLE)) {
                    // Make GET requests public
                    $routes[$route][$key]['permission_callback'] = '__return_true';
                }
            }
        }
    }
}
add_action('rest_api_init', 'override_settings_permissions', 99);