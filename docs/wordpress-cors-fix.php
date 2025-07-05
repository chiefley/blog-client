<?php
/**
 * Fix CORS for REST API - Add to functions.php
 * This allows the React development server to access the API
 */

// Add CORS headers to REST API responses
add_action('rest_api_init', function() {
    // Remove the default CORS handler
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    
    // Add our custom CORS handler
    add_filter('rest_pre_serve_request', function($value) {
        // Get the origin of the request
        $origin = get_http_origin();
        
        // List of allowed origins
        $allowed_origins = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:3000',
            'https://wa1x.thechief.com',
            'https://applefinch.thechief.com'
        ];
        
        // Check if origin is allowed, or allow all in development
        if (in_array($origin, $allowed_origins) || strpos($origin, 'localhost') !== false) {
            header('Access-Control-Allow-Origin: ' . $origin);
        } else {
            // For production, you might want to be more restrictive
            header('Access-Control-Allow-Origin: *');
        }
        
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 3600');
        
        return $value;
    });
}, 15);

// Handle preflight OPTIONS requests
add_action('init', function() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        // Get the origin
        $origin = get_http_origin();
        
        if ($origin) {
            header('Access-Control-Allow-Origin: ' . $origin);
        } else {
            header('Access-Control-Allow-Origin: *');
        }
        
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 3600');
        header('Content-Length: 0');
        header('Content-Type: text/plain');
        
        exit(0);
    }
}, 1);