<?php
/**
 * Fix REST API Access - Add to functions.php
 * This ensures the REST API endpoints we need are accessible
 */

// Remove any filters that might be blocking REST API access
add_action('init', function() {
    // Remove common filters that block REST API
    remove_filter('rest_authentication_errors', 'disable_rest_api_for_non_logged_in_users');
    remove_filter('rest_authentication_errors', '__return_true');
    
    // Remove filters with priority issues
    remove_all_filters('rest_authentication_errors');
}, 999);

// Allow public access to specific endpoints
add_filter('rest_authentication_errors', function($result, $server, $request) {
    // Get the route
    $route = $request->get_route();
    
    // Allow access to wp-json root (for site info)
    if ($route === '/wp-json' || $route === '/') {
        return true;
    }
    
    // Allow access to our custom endpoint
    if (strpos($route, '/site-info/v1/public') !== false) {
        return true;
    }
    
    // Allow read-only access to posts
    if (strpos($route, '/wp/v2/posts') !== false && $request->get_method() === 'GET') {
        return true;
    }
    
    // Allow read-only access to categories and tags
    if ((strpos($route, '/wp/v2/categories') !== false || 
         strpos($route, '/wp/v2/tags') !== false) && 
        $request->get_method() === 'GET') {
        return true;
    }
    
    return $result;
}, 10, 3);

// Alternative: Force enable REST API
add_filter('rest_enabled', '__return_true', 999);
add_filter('rest_jsonp_enabled', '__return_true', 999);

// Make sure CORS headers are set
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        header('Access-Control-Allow-Credentials: true');
        
        return $value;
    });
}, 15);

// Handle OPTIONS requests
add_action('init', function() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        header('Access-Control-Allow-Credentials: true');
        header('Content-Length: 0');
        header('Content-Type: text/plain');
        exit(0);
    }
});