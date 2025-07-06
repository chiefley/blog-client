<?php
/**
 * Plugin Name: Simple Auth for REST API
 * Description: Simple token-based authentication for WordPress REST API, replacing complex JWT implementations
 * Version: 1.0.0
 * Author: Your Name
 * License: GPL v2 or later
 * Network: true
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('SIMPLE_AUTH_VERSION', '1.0.0');
define('SIMPLE_AUTH_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SIMPLE_AUTH_PLUGIN_URL', plugin_dir_url(__FILE__));
define('SIMPLE_AUTH_TOKEN_EXPIRY', 7 * DAY_IN_SECONDS); // 7 days

// Load required files
require_once SIMPLE_AUTH_PLUGIN_DIR . 'includes/class-simple-auth.php';
require_once SIMPLE_AUTH_PLUGIN_DIR . 'includes/class-auth-endpoints.php';
require_once SIMPLE_AUTH_PLUGIN_DIR . 'includes/class-token-manager.php';

// Initialize the plugin
add_action('plugins_loaded', function() {
    Simple_Auth::get_instance();
});

// Activation hook
register_activation_hook(__FILE__, function() {
    // Create database table for tokens if needed
    Simple_Auth::activate();
});

// Deactivation hook
register_deactivation_hook(__FILE__, function() {
    // Cleanup if needed
    Simple_Auth::deactivate();
});

// Multisite hooks for new blog creation/deletion
if (is_multisite()) {
    // Hook for when a new blog is created
    add_action('wp_initialize_site', function($new_site) {
        Token_Manager::on_create_blog(
            $new_site->blog_id,
            0, // user_id not needed
            $new_site->domain,
            $new_site->path,
            $new_site->network_id,
            [] // meta not needed
        );
    }, 10, 1);
    
    // Hook for when a blog is deleted
    add_filter('wpmu_drop_tables', ['Token_Manager', 'on_delete_blog']);
}