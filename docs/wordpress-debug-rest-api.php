<?php
/**
 * Debug REST API Access Issues
 * Add this temporarily to your functions.php to diagnose the problem
 */

// Log all REST API authentication attempts
add_filter('rest_authentication_errors', function($result) {
    error_log('REST Auth Check: ' . print_r($result, true));
    error_log('Request URI: ' . $_SERVER['REQUEST_URI']);
    error_log('Request Method: ' . $_SERVER['REQUEST_METHOD']);
    
    // If there's an error, log it
    if (is_wp_error($result)) {
        error_log('REST Auth Error: ' . $result->get_error_message());
    }
    
    return $result;
}, 5);

// Check if REST API is being blocked
add_action('rest_api_init', function() {
    error_log('REST API Init - Checking access...');
    error_log('Current User: ' . get_current_user_id());
    error_log('Is SSL: ' . (is_ssl() ? 'Yes' : 'No'));
});

// Make sure our custom endpoint is registered
add_action('rest_api_init', function() {
    $routes = rest_get_server()->get_routes();
    if (isset($routes['/site-info/v1/public'])) {
        error_log('Custom site-info endpoint is registered!');
    } else {
        error_log('Custom site-info endpoint NOT found!');
    }
}, 20);

// Temporarily allow all REST API access for debugging
add_filter('rest_authentication_errors', function($result) {
    // Only for GET requests to our specific endpoints
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $uri = $_SERVER['REQUEST_URI'];
        
        // Allow access to root endpoint
        if (strpos($uri, '/wp-json') !== false && strpos($uri, '/wp-json/') === false) {
            error_log('Allowing access to wp-json root');
            return true;
        }
        
        // Allow access to our custom endpoint
        if (strpos($uri, '/site-info/v1/public') !== false) {
            error_log('Allowing access to site-info endpoint');
            return true;
        }
    }
    
    return $result;
}, 20);

// Check for common REST API blocking plugins/code
add_action('init', function() {
    // Check if REST API is disabled
    if (defined('REST_API_DISABLED') && REST_API_DISABLED) {
        error_log('REST API is disabled via REST_API_DISABLED constant!');
    }
    
    // Check for common security plugins that might block REST
    $active_plugins = get_option('active_plugins');
    $blocking_plugins = [
        'disable-json-api',
        'disable-rest-api',
        'wp-rest-api-controller'
    ];
    
    foreach ($active_plugins as $plugin) {
        foreach ($blocking_plugins as $blocker) {
            if (strpos($plugin, $blocker) !== false) {
                error_log('Potentially blocking plugin found: ' . $plugin);
            }
        }
    }
});